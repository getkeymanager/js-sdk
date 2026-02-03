/**
 * Configuration Management
 * 
 * Handles validation and storage of SDK configuration.
 * 
 * @module Config/Configuration
 */

const fs = require('fs');
const path = require('path');
const { ValidationError } = require('../exceptions');

/**
 * Configuration class for SDK
 */
class Configuration {
    static DEFAULT_TIMEOUT = 30000; // milliseconds
    static DEFAULT_CACHE_TTL = 300; // seconds
    static MAX_RETRY_ATTEMPTS = 3;
    static RETRY_DELAY_MS = 1000;

    /**
     * Create configuration from options
     * 
     * @param {Object} config - Configuration options
     * @param {string} config.apiKey - API key (required)
     * @param {string} [config.baseUrl='https://api.getkeymanager.com'] - Base API URL
     * @param {number} [config.timeout=30000] - Request timeout in ms
     * @param {boolean} [config.verifySignatures=true] - Verify response signatures
     * @param {string} [config.publicKey=null] - Public key for signature verification
     * @param {string} [config.publicKeyFile=null] - Path to public key file
     * @param {string} [config.environment=null] - Environment identifier
     * @param {boolean} [config.cacheEnabled=true] - Enable response caching
     * @param {number} [config.cacheTtl=300] - Cache TTL in seconds
     * @param {number} [config.retryAttempts=3] - Max retry attempts
     * @param {number} [config.retryDelay=1000] - Retry delay in ms
     * @param {string} [config.productId=null] - Product ID
     * @throws {ValidationError} If configuration is invalid
     */
    constructor(config) {
        this.validateConfig(config);

        this._apiKey = config.apiKey;
        this._baseUrl = config.baseUrl || 'https://api.getkeymanager.com';
        this._timeout = config.timeout !== undefined ? config.timeout : Configuration.DEFAULT_TIMEOUT;
        this._verifySignatures = config.verifySignatures !== false;
        
        // Load public key from file or use direct value
        this._publicKeyFile = config.publicKeyFile || null;
        this._publicKey = this.loadPublicKey(config.publicKey);
        
        this._environment = config.environment || null;
        this._cacheEnabled = config.cacheEnabled !== false;
        this._cacheTtl = config.cacheTtl !== undefined ? config.cacheTtl : Configuration.DEFAULT_CACHE_TTL;
        this._retryAttempts = config.retryAttempts !== undefined ? config.retryAttempts : Configuration.MAX_RETRY_ATTEMPTS;
        this._retryDelay = config.retryDelay !== undefined ? config.retryDelay : Configuration.RETRY_DELAY_MS;
        this._productId = config.productId || null;
    }

    /**
     * Validate configuration
     * 
     * @param {Object} config - Configuration to validate
     * @throws {ValidationError} If configuration is invalid
     * @private
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new ValidationError('Configuration must be an object');
        }

        if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
            throw new ValidationError('API key is required');
        }
    }

    /**
     * Load public key from file or use provided key
     * 
     * @param {string|null} publicKey - Direct public key value
     * @returns {string|null} Public key content or null
     * @throws {ValidationError} If public key file cannot be read
     * @private
     */
    loadPublicKey(publicKey) {
        // Try to load from file first (preferred method)
        if (this._publicKeyFile) {
            const filePath = this.resolvePath(this._publicKeyFile);
            
            try {
                if (!fs.existsSync(filePath)) {
                    throw new ValidationError(`Public key file not found: ${this._publicKeyFile}`);
                }
                
                const content = fs.readFileSync(filePath, 'utf8');
                return content.trim();
            } catch (error) {
                if (error instanceof ValidationError) {
                    throw error;
                }
                throw new ValidationError(`Cannot read public key file: ${this._publicKeyFile} - ${error.message}`);
            }
        }
        
        // Fall back to publicKey from config (deprecated)
        return publicKey || null;
    }

    /**
     * Resolve file path with support for common patterns
     * 
     * @param {string} filePath - File path (can be absolute or relative)
     * @returns {string} Resolved absolute path
     * @private
     */
    resolvePath(filePath) {
        // If path starts with /, it's already absolute
        if (filePath.startsWith('/')) {
            return filePath;
        }
        
        // If path starts with ~, expand home directory
        if (filePath.startsWith('~')) {
            const home = process.env.HOME || process.env.USERPROFILE;
            if (home) {
                return path.join(home, filePath.substring(1));
            }
        }
        
        // Relative paths are resolved from current working directory
        return path.resolve(process.cwd(), filePath);
    }

    // Getters
    getApiKey() { return this._apiKey; }
    getBaseUrl() { return this._baseUrl; }
    getTimeout() { return this._timeout; }
    shouldVerifySignatures() { return this._verifySignatures; }
    getPublicKey() { return this._publicKey; }
    getEnvironment() { return this._environment; }
    isCacheEnabled() { return this._cacheEnabled; }
    getCacheTtl() { return this._cacheTtl; }
    getRetryAttempts() { return this._retryAttempts; }
    getRetryDelay() { return this._retryDelay; }
    getProductId() { return this._productId; }
}

module.exports = Configuration;
