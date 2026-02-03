/**
 * License Management Platform - JavaScript/Node.js SDK Client
 * 
 * Official Node.js client for license validation, activation, and management.
 * This is the main entry point that delegates to specialized components.
 * 
 * @version 2.0.0
 * @license MIT
 */

const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

// Configuration and core components
const Configuration = require('./config/configuration');
const HttpClient = require('./http/http-client');
const CacheManager = require('./cache/cache-manager');
const SignatureVerifier = require('./signature-verifier');
const StateStore = require('./state-store');
const StateResolver = require('./state-resolver');

// Specialized managers
const LicenseValidator = require('./validation/license-validator');
const LicenseManager = require('./management/license-manager');
const ProductManager = require('./management/product-manager');
const ContractManager = require('./management/contract-manager');
const FeatureChecker = require('./features/feature-checker');
const TelemetryClient = require('./telemetry/telemetry-client');
const DownloadManager = require('./downloads/download-manager');

// Exceptions
const { ValidationError } = require('./exceptions');

/**
 * Main License Client
 */
class LicenseClient {
    static VERSION = '2.0.0';

    /**
     * Initialize License Client
     * 
     * @param {Object} config - Configuration options
     */
    constructor(config) {
        this._config = new Configuration(config);

        // Initialize signature verifier if needed
        this._signatureVerifier = null;
        if (this._config.shouldVerifySignatures() && this._config.getPublicKey()) {
            this._signatureVerifier = new SignatureVerifier(this._config.getPublicKey());
        }

        // Initialize StateStore and StateResolver for hardened validation
        this._stateStore = new StateStore(this._signatureVerifier, this._config.getCacheTtl());
        this._stateResolver = new StateResolver(
            this._signatureVerifier,
            this._config.getEnvironment(),
            this._config.getProductId()
        );

        // Lazy-loaded components (initialized on first use)
        this._httpClient = null;
        this._cacheManager = null;
        this._validator = null;
        this._licenseManager = null;
        this._productManager = null;
        this._contractManager = null;
        this._featureChecker = null;
        this._telemetryClient = null;
        this._downloadManager = null;
    }

    // ========================================================================
    // LAZY COMPONENT INITIALIZATION
    // ========================================================================

    _getHttpClient() {
        if (this._httpClient === null) {
            this._httpClient = new HttpClient(
                this._config,
                this._signatureVerifier,
                this._stateResolver
            );
        }
        return this._httpClient;
    }

    _getCacheManager() {
        if (this._cacheManager === null) {
            this._cacheManager = new CacheManager(
                this._config.isCacheEnabled(),
                this._config.getCacheTtl()
            );
        }
        return this._cacheManager;
    }

    _getValidator() {
        if (this._validator === null) {
            this._validator = new LicenseValidator(
                this._config,
                this._getHttpClient(),
                this._getCacheManager(),
                this._stateStore,
                this._stateResolver,
                this._signatureVerifier
            );
        }
        return this._validator;
    }

    _getLicenseManager() {
        if (this._licenseManager === null) {
            this._licenseManager = new LicenseManager(
                this._config,
                this._getHttpClient(),
                this._getCacheManager()
            );
        }
        return this._licenseManager;
    }

    _getProductManager() {
        if (this._productManager === null) {
            this._productManager = new ProductManager(
                this._config,
                this._getHttpClient(),
                this._getCacheManager()
            );
        }
        return this._productManager;
    }

    _getContractManager() {
        if (this._contractManager === null) {
            this._contractManager = new ContractManager(
                this._config,
                this._getHttpClient(),
                this._getCacheManager()
            );
        }
        return this._contractManager;
    }

    _getFeatureChecker() {
        if (this._featureChecker === null) {
            this._featureChecker = new FeatureChecker(
                this._config,
                this._getHttpClient(),
                this._getCacheManager(),
                this._stateResolver
            );
            this._featureChecker.setValidator(this._getValidator());
        }
        return this._featureChecker;
    }

    _getTelemetryClient() {
        if (this._telemetryClient === null) {
            this._telemetryClient = new TelemetryClient(
                this._config,
                this._getHttpClient()
            );
        }
        return this._telemetryClient;
    }

    _getDownloadManager() {
        if (this._downloadManager === null) {
            this._downloadManager = new DownloadManager(
                this._config,
                this._getHttpClient(),
                this._getCacheManager()
            );
        }
        return this._downloadManager;
    }

    // ========================================================================
    // VALIDATION & STATE MANAGEMENT
    // ========================================================================

    async validateLicense(licenseKey, options = {}) {
        return this._getValidator().validateLicense(licenseKey, options);
    }

    async resolveLicenseState(licenseKey, options = {}) {
        return this._getValidator().resolveLicenseState(licenseKey, options);
    }

    async isFeatureAllowed(licenseKey, feature) {
        return this._getValidator().isFeatureAllowed(licenseKey, feature);
    }

    async getLicenseState(licenseKey, options = {}) {
        return this._getValidator().getLicenseState(licenseKey, options);
    }

    async requireCapability(licenseKey, capability) {
        return this._getValidator().requireCapability(licenseKey, capability);
    }

    clearLicenseState(licenseKey) {
        this._getValidator().clearLicenseState(licenseKey);
    }

    async activateLicense(licenseKey, options = {}) {
        return this._getValidator().activateLicense(licenseKey, options);
    }

    async deactivateLicense(licenseKey, options = {}) {
        return this._getValidator().deactivateLicense(licenseKey, options);
    }

    validateOfflineLicense(offlineLicenseData, options = {}) {
        return this._getValidator().validateOfflineLicense(offlineLicenseData, options);
    }

    // ========================================================================
    // FEATURE CHECKING
    // ========================================================================

    async checkFeature(licenseKey, featureName) {
        return this._getFeatureChecker().checkFeature(licenseKey, featureName);
    }

    // ========================================================================
    // LICENSE MANAGEMENT
    // ========================================================================

    async createLicenseKeys(productUuid, generatorUuid, licenses, customerEmail = null, options = {}) {
        return this._getLicenseManager().createLicenseKeys(productUuid, generatorUuid, licenses, customerEmail, options);
    }

    async updateLicenseKey(licenseKey, options = {}) {
        return this._getLicenseManager().updateLicenseKey(licenseKey, options);
    }

    async deleteLicenseKey(licenseKey) {
        return this._getLicenseManager().deleteLicenseKey(licenseKey);
    }

    async getLicenseKeys(filters = {}) {
        return this._getLicenseManager().getLicenseKeys(filters);
    }

    async getLicenseDetails(licenseKey) {
        return this._getLicenseManager().getLicenseDetails(licenseKey);
    }

    async getAvailableLicenseKeysCount(productUuid) {
        return this._getLicenseManager().getAvailableLicenseKeysCount(productUuid);
    }

    async assignLicenseKey(licenseKey, customerEmail, customerName = null) {
        return this._getLicenseManager().assignLicenseKey(licenseKey, customerEmail, customerName);
    }

    async randomAssignLicenseKeys(productUuid, generatorUuid, quantity, customerEmail, customerName = null, options = {}) {
        return this._getLicenseManager().randomAssignLicenseKeys(productUuid, generatorUuid, quantity, customerEmail, customerName, options);
    }

    async randomAssignLicenseKeysQueued(productUuid, generatorUuid, quantity, customerEmail, customerName = null, options = {}) {
        return this._getLicenseManager().randomAssignLicenseKeysQueued(productUuid, generatorUuid, quantity, customerEmail, customerName, options);
    }

    async assignAndActivateLicenseKey(licenseKey, customerEmail, identifier, options = {}) {
        return this._getLicenseManager().assignAndActivateLicenseKey(licenseKey, customerEmail, identifier, options);
    }

    async createLicenseKeyMeta(licenseKey, metaKey, metaValue) {
        return this._getLicenseManager().createLicenseKeyMeta(licenseKey, metaKey, metaValue);
    }

    async updateLicenseKeyMeta(licenseKey, metaKey, metaValue) {
        return this._getLicenseManager().updateLicenseKeyMeta(licenseKey, metaKey, metaValue);
    }

    async deleteLicenseKeyMeta(licenseKey, metaKey) {
        return this._getLicenseManager().deleteLicenseKeyMeta(licenseKey, metaKey);
    }

    // ========================================================================
    // PRODUCT MANAGEMENT
    // ========================================================================

    async createProduct(name, options = {}) {
        return this._getProductManager().createProduct(name, options);
    }

    async updateProduct(productUuid, options = {}) {
        return this._getProductManager().updateProduct(productUuid, options);
    }

    async deleteProduct(productUuid) {
        return this._getProductManager().deleteProduct(productUuid);
    }

    async getAllProducts() {
        return this._getProductManager().getAllProducts();
    }

    async createProductMeta(productUuid, metaKey, metaValue) {
        return this._getProductManager().createProductMeta(productUuid, metaKey, metaValue);
    }

    async updateProductMeta(productUuid, metaKey, metaValue) {
        return this._getProductManager().updateProductMeta(productUuid, metaKey, metaValue);
    }

    async deleteProductMeta(productUuid, metaKey) {
        return this._getProductManager().deleteProductMeta(productUuid, metaKey);
    }

    // ========================================================================
    // CONTRACT MANAGEMENT
    // ========================================================================

    async getAllContracts() {
        return this._getContractManager().getAllContracts();
    }

    async createContract(contractData, options = {}) {
        return this._getContractManager().createContract(contractData, options);
    }

    async updateContract(contractId, contractData) {
        return this._getContractManager().updateContract(contractId, contractData);
    }

    async deleteContract(contractId) {
        return this._getContractManager().deleteContract(contractId);
    }

    // ========================================================================
    // DOWNLOADS
    // ========================================================================

    async accessDownloadables(licenseKey, options = {}) {
        return this._getDownloadManager().accessDownloadables(licenseKey, options);
    }

    async getProductChangelog(slug) {
        return this._getDownloadManager().getProductChangelog(slug);
    }

    async getAllGenerators(productUuid = null) {
        return this._getDownloadManager().getAllGenerators(productUuid);
    }

    async generateLicenseKeys(generatorUuid, quantity, options = {}) {
        return this._getDownloadManager().generateLicenseKeys(generatorUuid, quantity, options);
    }

    // ========================================================================
    // TELEMETRY
    // ========================================================================

    async sendTelemetry(dataType, dataGroup, dataValues = [], options = {}) {
        return this._getTelemetryClient().sendTelemetry(dataType, dataGroup, dataValues, options);
    }

    async getTelemetryData(dataType, dataGroup, filters = {}) {
        return this._getTelemetryClient().getTelemetryData(dataType, dataGroup, filters);
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    generateHardwareId() {
        const identifiers = [];

        try {
            identifiers.push(os.hostname());
            identifiers.push(os.platform());
            identifiers.push(os.arch());

            if (os.platform() === 'win32') {
                try {
                    const uuid = execSync('wmic csproduct get uuid', { encoding: 'utf8' });
                    const lines = uuid.split('\n');
                    if (lines[1]) {
                        identifiers.push(lines[1].trim());
                    }
                } catch (e) {}
            } else if (os.platform() === 'linux') {
                try {
                    const fs = require('fs');
                    if (fs.existsSync('/etc/machine-id')) {
                        identifiers.push(fs.readFileSync('/etc/machine-id', 'utf8').trim());
                    } else if (fs.existsSync('/var/lib/dbus/machine-id')) {
                        identifiers.push(fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim());
                    }
                } catch (e) {}
            } else if (os.platform() === 'darwin') {
                try {
                    const uuid = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf8' });
                    const match = uuid.match(/"([^"]+)"$/);
                    if (match && match[1]) {
                        identifiers.push(match[1]);
                    }
                } catch (e) {}
            }
        } catch (e) {}

        if (identifiers.length === 0) {
            identifiers.push(os.hostname());
            identifiers.push(os.platform());
        }

        identifiers.sort();
        const combined = identifiers.join('|');
        return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32);
    }

    clearCache() {
        this._getCacheManager().clear();
    }

    clearLicenseCache(licenseKey) {
        this._getCacheManager().clearPattern(`license:${licenseKey}:*`);
    }

    generateUuid() {
        return crypto.randomUUID();
    }
}

module.exports = LicenseClient;
