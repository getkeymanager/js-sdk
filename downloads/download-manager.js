const crypto = require('crypto');

/**
 * Download Manager
 * 
 * Handles downloadables, changelogs, and generator operations.
 * 
 * @class DownloadManager
 */
class DownloadManager {
    /**
     * Initialize download manager
     * 
     * @param {Object} httpClient - HTTP client instance
     * @param {Object} cacheManager - Cache manager instance
     */
    constructor(httpClient, cacheManager) {
        if (!httpClient || !cacheManager) {
            throw new Error('httpClient and cacheManager are required');
        }
        this.httpClient = httpClient;
        this.cacheManager = cacheManager;
    }

    /**
     * Access downloadables for a license
     * 
     * @param {string} licenseKey - License key
     * @param {Object} options - Additional options (product_uuid, version, identifier)
     * @returns {Promise<Object>} Downloadable files with signed URLs
     * @throws {Error}
     */
    async accessDownloadables(licenseKey, options = {}) {
        this.validateLicenseKey(licenseKey);

        const payload = {
            license_key: licenseKey,
            ...options
        };

        const response = await this.httpClient.request('POST', '/v1/access-downloadables', payload);

        return response;
    }

    /**
     * Get product changelog (public endpoint, no auth required)
     * 
     * @param {string} slug - Product slug
     * @returns {Promise<Object>} Changelog entries
     * @throws {Error}
     */
    async getProductChangelog(slug) {
        if (!slug) {
            throw new Error('Product slug is required');
        }

        const cacheKey = this.cacheManager.generateKey('changelog', slug);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        // This endpoint doesn't require authentication, so we make a simpler request
        const response = await this.httpClient.requestPublic('GET', `/v1/products/${slug}/changelog`);

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Get all generators
     * 
     * @param {string|null} productUuid - Optional product UUID filter
     * @returns {Promise<Object>} Generators list
     * @throws {Error}
     */
    async getAllGenerators(productUuid = null) {
        const cacheKey = this.cacheManager.generateKey('generators', productUuid || 'all');
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        let endpoint = '/v1/get-all-generators';
        if (productUuid) {
            const query = new URLSearchParams({ product_uuid: productUuid }).toString();
            endpoint += '?' + query;
        }

        const response = await this.httpClient.request('GET', endpoint);

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Generate license keys
     * 
     * @param {string} generatorUuid - Generator UUID
     * @param {number} quantity - Number of licenses to generate
     * @param {Object} options - Optional parameters (activation_limit, validity_days, idempotencyKey)
     * @returns {Promise<Object>} Generated licenses
     * @throws {Error}
     */
    async generateLicenseKeys(generatorUuid, quantity, options = {}) {
        if (!generatorUuid) {
            throw new Error('Generator UUID is required');
        }

        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }

        const payload = {
            generator_uuid: generatorUuid,
            quantity: quantity
        };

        if (options.activation_limit !== undefined) {
            payload.activation_limit = options.activation_limit;
        }

        if (options.validity_days !== undefined) {
            payload.validity_days = options.validity_days;
        }

        const idempotencyKey = options.idempotencyKey || this.generateUuid();

        const response = await this.httpClient.request(
            'POST',
            '/v1/generate',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        return response;
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

    /**
     * Generate UUID v4
     * 
     * @returns {string} UUID
     * @private
     */
    generateUuid() {
        const bytes = crypto.randomBytes(16);
        
        // Set version to 0100 (UUID v4)
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        
        // Set variant to 10xx (RFC 4122)
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        
        const hex = bytes.toString('hex');
        return [
            hex.substring(0, 8),
            hex.substring(8, 12),
            hex.substring(12, 16),
            hex.substring(16, 20),
            hex.substring(20, 32)
        ].join('-');
    }
}

module.exports = DownloadManager;
