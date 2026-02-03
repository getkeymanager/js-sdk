/**
 * Feature Checker
 * 
 * Handles feature checking and validation.
 * 
 * @class FeatureChecker
 */
class FeatureChecker {
    /**
     * Initialize feature checker
     * 
     * @param {Object} httpClient - HTTP client instance
     * @param {Object} cacheManager - Cache manager instance
     * @param {Object} stateResolver - State resolver instance
     */
    constructor(httpClient, cacheManager, stateResolver) {
        if (!httpClient || !cacheManager || !stateResolver) {
            throw new Error('httpClient, cacheManager, and stateResolver are required');
        }
        this.httpClient = httpClient;
        this.cacheManager = cacheManager;
        this.stateResolver = stateResolver;
        this.validator = null;
    }

    /**
     * Set the validator for state-based feature checking
     * 
     * @param {Object} validator - License validator instance
     */
    setValidator(validator) {
        this.validator = validator;
    }

    /**
     * Check if a feature is enabled for a license
     * 
     * @param {string} licenseKey - License key
     * @param {string} featureName - Feature name
     * @returns {Promise<Object>} Feature check result
     * @throws {Error}
     */
    async checkFeature(licenseKey, featureName) {
        this.validateLicenseKey(licenseKey);

        if (!featureName) {
            throw new Error('Feature name cannot be empty');
        }

        const cacheKey = this.cacheManager.generateKey('license', licenseKey, 'feature', featureName);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request(
            'GET',
            `/v1/licenses/${licenseKey}/features/${featureName}`
        );

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Check if a feature is allowed (State-Based)
     * 
     * Delegates to LicenseValidator for state-based feature checking
     * with proper capability resolution.
     * 
     * @param {string} licenseKey - License key
     * @param {string} feature - Feature name
     * @returns {Promise<boolean>} True if feature is allowed
     * @throws {Error}
     */
    async isFeatureAllowed(licenseKey, feature) {
        if (this.validator === null) {
            throw new Error('Validator not set. Call setValidator() first.');
        }

        return await this.validator.isFeatureAllowed(licenseKey, feature);
    }

    /**
     * Validate license key format
     * 
     * @param {string} licenseKey - License key
     * @throws {Error}
     * @private
     */
    validateLicenseKey(licenseKey) {
        if (!licenseKey) {
            throw new Error('License key cannot be empty');
        }
    }
}

module.exports = FeatureChecker;
