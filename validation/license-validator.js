/**
 * License Validator
 * 
 * Handles license validation, activation, deactivation, and state management.
 * 
 * @module Validation/LicenseValidator
 */

const crypto = require('crypto');
const { 
    LicenseException, 
    ValidationException, 
    SignatureException, 
    NetworkException,
    StateException 
} = require('../exceptions');
const LicenseState = require('../license-state');
const SignatureVerifier = require('../signature-verifier');
const CacheManager = require('../cache/cache-manager');

/**
 * License Validator class
 */
class LicenseValidator {
    /**
     * Initialize validator
     * 
     * @param {Configuration} config - SDK configuration
     * @param {HttpClient} httpClient - HTTP client
     * @param {CacheManager} cacheManager - Cache manager
     * @param {StateStore} stateStore - State store
     * @param {StateResolver} stateResolver - State resolver
     * @param {SignatureVerifier|null} signatureVerifier - Optional signature verifier
     */
    constructor(config, httpClient, cacheManager, stateStore, stateResolver, signatureVerifier = null) {
        this._config = config;
        this._httpClient = httpClient;
        this._cacheManager = cacheManager;
        this._stateStore = stateStore;
        this._stateResolver = stateResolver;
        this._signatureVerifier = signatureVerifier;
    }

    /**
     * Validate a license key online
     * 
     * @param {string} licenseKey - License key to validate
     * @param {Object} options - Optional parameters (hardwareId, domain, productId)
     * @returns {Promise<Object>} Validation result
     * @throws {LicenseException}
     */
    async validateLicense(licenseKey, options = {}) {
        this._validateLicenseKey(licenseKey);

        const cacheKey = CacheManager.generateKey('license', licenseKey, 'validation');
        const cached = this._cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const payload = { license_key: licenseKey, ...options };
        
        const response = await this._httpClient.request('POST', '/v1/verify', payload);

        this._cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Resolve License State (Hardened Validation)
     * 
     * Returns a LicenseState object that provides unified access to license status,
     * capabilities, and feature gates. This method implements the hardened validation
     * with signature verification and grace period support.
     * 
     * @param {string} licenseKey - License key to validate
     * @param {Object} options - Optional parameters (hardwareId, domain, productId)
     * @returns {Promise<LicenseState>} License state object
     * @throws {LicenseException}
     */
    async resolveLicenseState(licenseKey, options = {}) {
        this._validateLicenseKey(licenseKey);

        // Try to get from StateStore first
        const stateKey = this._stateStore.getValidationKey(licenseKey);
        
        if (this._config.isCacheEnabled()) {
            try {
                const cachedState = this._stateStore.get(stateKey);
                if (cachedState !== null) {
                    // Check if revalidation is needed
                    if (!cachedState.needsRevalidation()) {
                        return new LicenseState(cachedState, licenseKey);
                    }
                }
            } catch (e) {
                if (e instanceof SignatureException) {
                    // Cached state signature invalid - continue to revalidate
                }
            }
        }

        // Perform validation
        try {
            const response = await this.validateLicense(licenseKey, options);
            const licenseState = this._stateResolver.resolveFromValidation(response, licenseKey);
            
            // Store in StateStore
            if (this._config.isCacheEnabled()) {
                this._stateStore.set(stateKey, licenseState.getEntitlementState());
            }
            
            return licenseState;
        } catch (e) {
            if (e instanceof NetworkException) {
                // Network error - try to use cached state in grace period
                try {
                    const cachedState = this._stateStore.get(stateKey);
                    if (cachedState !== null && cachedState.allowsOperation()) {
                        // Return grace state
                        return this._stateResolver.createGraceState(
                            cachedState.toArray(),
                            licenseKey
                        );
                    }
                } catch (se) {
                    if (se instanceof SignatureException) {
                        // Invalid cache - throw original network error
                    }
                }
            }
            
            throw e;
        }
    }

    /**
     * Check if a feature is allowed (State-Based)
     * 
     * This method uses LicenseState for feature checking with proper
     * capability resolution.
     * 
     * @param {string} licenseKey - License key
     * @param {string} feature - Feature name
     * @returns {Promise<boolean>} True if feature is allowed
     * @throws {LicenseException}
     */
    async isFeatureAllowed(licenseKey, feature) {
        const licenseState = await this.resolveLicenseState(licenseKey);
        return licenseState.allows(feature);
    }

    /**
     * Get License State (Public API)
     * 
     * Convenience method that returns license state without throwing exceptions
     * on validation failure (returns restricted state instead).
     * 
     * @param {string} licenseKey - License key
     * @param {Object} options - Optional parameters
     * @returns {Promise<LicenseState>} License state object
     */
    async getLicenseState(licenseKey, options = {}) {
        try {
            return await this.resolveLicenseState(licenseKey, options);
        } catch (e) {
            if (e instanceof LicenseException) {
                // Return restricted state on error
                return this._stateResolver.createRestrictedState(
                    e.message,
                    licenseKey
                );
            }
            throw e;
        }
    }

    /**
     * Validate and get state for update/download operations
     * 
     * This method enforces that updates/downloads require a valid state
     * with appropriate capabilities.
     * 
     * @param {string} licenseKey - License key
     * @param {string} capability - Required capability ('updates' or 'downloads')
     * @returns {Promise<LicenseState>} Validated state
     * @throws {StateException} If capability not allowed
     */
    async requireCapability(licenseKey, capability) {
        const state = await this.resolveLicenseState(licenseKey);
        
        if (!state.allows(capability)) {
            throw new StateException(
                `License does not have required capability: ${capability}`,
                403,
                StateException.ERROR_INVALID_STATE,
                { capability, state: state.getState() }
            );
        }
        
        return state;
    }

    /**
     * Clear state cache for a license
     * 
     * @param {string} licenseKey - License key
     */
    clearLicenseState(licenseKey) {
        this._stateStore.clearLicense(licenseKey);
        this._cacheManager.clearPattern(`license:${licenseKey}:*`);
    }

    /**
     * Activate a license on a device or domain
     * 
     * @param {string} licenseKey - License key
     * @param {Object} options - Activation options (hardwareId OR domain required)
     * @returns {Promise<Object>} Activation result
     * @throws {LicenseException}
     */
    async activateLicense(licenseKey, options = {}) {
        this._validateLicenseKey(licenseKey);

        if (!options.hardwareId && !options.domain) {
            throw new ValidationException('Either hardwareId or domain is required');
        }

        const payload = { license_key: licenseKey, ...options };

        const idempotencyKey = options.idempotencyKey || this._generateUuid();
        
        const response = await this._httpClient.request(
            'POST',
            '/v1/activate',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        this._cacheManager.clearPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Deactivate a license from a device or domain
     * 
     * @param {string} licenseKey - License key
     * @param {Object} options - Deactivation options
     * @returns {Promise<Object>} Deactivation result
     * @throws {LicenseException}
     */
    async deactivateLicense(licenseKey, options = {}) {
        this._validateLicenseKey(licenseKey);

        const payload = { license_key: licenseKey, ...options };

        const idempotencyKey = options.idempotencyKey || this._generateUuid();

        const response = await this._httpClient.request(
            'POST',
            '/v1/deactivate',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        this._cacheManager.clearPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Get license file content for offline validation
     * 
     * Retrieve .lic file content for offline license validation. Returns base64 encoded 
     * license file with cryptographic signature that can be verified offline using 
     * the product's public key.
     * 
     * @param {string} licenseKey - License key
     * @param {Object} options - Optional parameters (identifier for hardware-bound licenses)
     * @returns {Promise<Object>} License file result with licFileContent
     * @throws {LicenseException}
     */
    async getLicenseFile(licenseKey, options = {}) {
        this._validateLicenseKey(licenseKey);

        const payload = { license_key: licenseKey, ...options };

        const response = await this._httpClient.request('POST', '/v1/get-license-file', payload);

        return response;
    }

    /**
     * Validate an offline license file
     * 
     * @param {string|Object} offlineLicenseData - JSON string or parsed object
     * @param {Object} options - Validation options (hardwareId, publicKey)
     * @returns {Object} Validation result
     * @throws {LicenseException}
     */
    validateOfflineLicense(offlineLicenseData, options = {}) {
        let data;
        
        if (typeof offlineLicenseData === 'string') {
            try {
                data = JSON.parse(offlineLicenseData);
            } catch (e) {
                throw new ValidationException('Invalid JSON: ' + e.message);
            }
        } else {
            data = offlineLicenseData;
        }

        const errors = [];

        if (!data.license || !data.signature) {
            throw new ValidationException('Invalid offline license format');
        }

        const publicKey = options.publicKey || this._config.getPublicKey();
        if (!publicKey) {
            throw new ValidationException('Public key is required for offline validation');
        }

        const verifier = new SignatureVerifier(publicKey);
        const signature = data.signature;
        const dataWithoutSignature = { ...data };
        delete dataWithoutSignature.signature;

        try {
            const payload = JSON.stringify(dataWithoutSignature);
            if (!verifier.verify(payload, signature)) {
                errors.push('Signature verification failed');
            }
        } catch (e) {
            errors.push('Signature verification error: ' + e.message);
        }

        if (data.license.expires_at) {
            const expiresAt = new Date(data.license.expires_at).getTime();
            const now = Date.now();
            const tolerance = 24 * 3600 * 1000; // 24 hours in milliseconds

            if (now - tolerance > expiresAt) {
                errors.push('License has expired');
            }
        }

        if (options.hardwareId && data.license.hardware_id) {
            if (options.hardwareId !== data.license.hardware_id) {
                errors.push('Hardware ID mismatch');
            }
        }

        return {
            valid: errors.length === 0,
            license: data.license || {},
            errors
        };
    }

    /**
     * Validate license key format
     * 
     * @param {string} licenseKey - License key
     * @throws {ValidationException}
     * @private
     */
    _validateLicenseKey(licenseKey) {
        if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim() === '') {
            throw new ValidationException('License key cannot be empty');
        }
    }

    /**
     * Generate UUID v4
     * 
     * @returns {string} UUID
     * @private
     */
    _generateUuid() {
        return crypto.randomUUID();
    }
}

module.exports = LicenseValidator;
