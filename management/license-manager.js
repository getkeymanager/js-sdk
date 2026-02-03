const crypto = require('crypto');

/**
 * License Manager
 * 
 * Handles CRUD operations for licenses, assignments, and metadata.
 * 
 * @class LicenseManager
 */
class LicenseManager {
    /**
     * Initialize license manager
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
     * Create license keys
     * 
     * @param {string} productUuid - Product UUID
     * @param {string} generatorUuid - Generator UUID
     * @param {Array} licenses - License data array
     * @param {string|null} customerEmail - Optional customer email
     * @param {Object} options - Additional options (idempotencyKey)
     * @returns {Promise<Object>} Creation result
     * @throws {Error}
     */
    async createLicenseKeys(productUuid, generatorUuid, licenses, customerEmail = null, options = {}) {
        if (!productUuid || !generatorUuid) {
            throw new Error('Product UUID and Generator UUID are required');
        }

        if (!licenses || licenses.length === 0) {
            throw new Error('Licenses array cannot be empty');
        }

        const payloadLicenses = licenses.map(license => ({
            product_uuid: productUuid,
            generator_uuid: generatorUuid,
            customer_email: customerEmail,
            ...license
        }));

        const payload = {
            licenses: payloadLicenses
        };

        const idempotencyKey = options.idempotencyKey || this.generateUuid();

        const response = await this.httpClient.request(
            'POST',
            '/v1/create-license-keys',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        return response;
    }

    /**
     * Update license key
     * 
     * @param {string} licenseKey - License key
     * @param {Object} options - Update options (status, activation_limit, validity_days)
     * @returns {Promise<Object>} Update result
     * @throws {Error}
     */
    async updateLicenseKey(licenseKey, options = {}) {
        this.validateLicenseKey(licenseKey);

        const payload = { license_key: licenseKey };

        if (options.status !== undefined) {
            payload.status = options.status;
        }

        if (options.activation_limit !== undefined) {
            payload.activation_limit = options.activation_limit;
        }

        if (options.validity_days !== undefined) {
            payload.validity_days = options.validity_days;
        }

        if (options.metadata !== undefined) {
            payload.metadata = options.metadata;
        } else if (options.feature_flags !== undefined) {
            payload.metadata = options.feature_flags;
        }

        const response = await this.httpClient.request('POST', '/v1/update-license-key', payload);

        await this.cacheManager.clearByPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Delete license key
     * 
     * @param {string} licenseKey - License key
     * @returns {Promise<Object>} Deletion result
     * @throws {Error}
     */
    async deleteLicenseKey(licenseKey) {
        this.validateLicenseKey(licenseKey);

        const response = await this.httpClient.request('POST', '/v1/delete-license-key', {
            license_key: licenseKey
        });

        await this.cacheManager.clearByPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Get license keys
     * 
     * @param {Object} filters - Optional filters (product_uuid, status, customer_email)
     * @returns {Promise<Object>} License keys
     * @throws {Error}
     */
    async getLicenseKeys(filters = {}) {
        const queryParams = {};

        if (filters.product_uuid) {
            queryParams.product_uuid = filters.product_uuid;
        }

        if (filters.status) {
            queryParams.status = filters.status;
        }

        if (filters.customer_email) {
            queryParams.customer_email = filters.customer_email;
        }

        let endpoint = '/v1/get-license-keys';
        if (Object.keys(queryParams).length > 0) {
            const query = new URLSearchParams(queryParams).toString();
            endpoint += '?' + query;
        }

        const response = await this.httpClient.request('GET', endpoint);

        return response;
    }

    /**
     * Get license details
     * 
     * @param {string} licenseKey - License key
     * @returns {Promise<Object>} License details
     * @throws {Error}
     */
    async getLicenseDetails(licenseKey) {
        this.validateLicenseKey(licenseKey);

        const cacheKey = this.cacheManager.generateKey('license', licenseKey, 'details');
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request('POST', '/v1/get-license-key-details', {
            license_key: licenseKey
        });

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Get available license keys count
     * 
     * @param {string} productUuid - Product UUID
     * @param {string|null} generatorUuid - Optional generator UUID
     * @returns {Promise<Object>} Count result
     * @throws {Error}
     */
    async getAvailableLicenseKeysCount(productUuid, generatorUuid = null) {
        if (!productUuid) {
            throw new Error('Product UUID is required');
        }

        const params = { product_uuid: productUuid };
        if (generatorUuid) {
            params.generator_uuid = generatorUuid;
        }

        const query = new URLSearchParams(params).toString();
        const response = await this.httpClient.request('GET', `/v1/get-available-license-keys-count?${query}`);

        return response;
    }

    /**
     * Assign license key to customer
     * 
     * @param {string} licenseKey - License key
     * @param {string} customerEmail - Customer email
     * @param {string|null} customerName - Optional customer name
     * @returns {Promise<Object>} Assignment result
     * @throws {Error}
     */
    async assignLicenseKey(licenseKey, customerEmail, customerName = null) {
        this.validateLicenseKey(licenseKey);

        if (!customerEmail) {
            throw new Error('Customer email is required');
        }

        const payload = {
            license_key: licenseKey,
            customer_email: customerEmail
        };

        if (customerName) {
            payload.customer_name = customerName;
        }

        const response = await this.httpClient.request('POST', '/v1/assign-license-key', payload);

        await this.cacheManager.clearByPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Random assign license keys (synchronous)
     * 
     * @param {string} productUuid - Product UUID
     * @param {string} generatorUuid - Generator UUID
     * @param {number} quantity - Number of licenses to assign
     * @param {string} customerEmail - Customer email
     * @param {string|null} customerName - Optional customer name
     * @param {Object} options - Additional options (idempotencyKey)
     * @returns {Promise<Object>} Assignment result
     * @throws {Error}
     */
    async randomAssignLicenseKeys(productUuid, generatorUuid, quantity, customerEmail, customerName = null, options = {}) {
        if (!productUuid || !generatorUuid) {
            throw new Error('Product UUID and Generator UUID are required');
        }

        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }

        if (!customerEmail) {
            throw new Error('Customer email is required');
        }

        const payload = {
            product_uuid: productUuid,
            generator_uuid: generatorUuid,
            quantity: quantity,
            customer_email: customerEmail
        };

        if (customerName) {
            payload.customer_name = customerName;
        }

        const idempotencyKey = options.idempotencyKey || this.generateUuid();

        const response = await this.httpClient.request(
            'POST',
            '/v1/random-assign-license-keys',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        return response;
    }

    /**
     * Random assign license keys (queued/asynchronous)
     * 
     * @param {string} productUuid - Product UUID
     * @param {string} generatorUuid - Generator UUID
     * @param {number} quantity - Number of licenses to assign
     * @param {string} customerEmail - Customer email
     * @param {string|null} customerName - Optional customer name
     * @param {Object} options - Additional options (idempotencyKey)
     * @returns {Promise<Object>} Job queued result
     * @throws {Error}
     */
    async randomAssignLicenseKeysQueued(productUuid, generatorUuid, quantity, customerEmail, customerName = null, options = {}) {
        if (!productUuid || !generatorUuid) {
            throw new Error('Product UUID and Generator UUID are required');
        }

        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }

        if (!customerEmail) {
            throw new Error('Customer email is required');
        }

        const payload = {
            product_uuid: productUuid,
            generator_uuid: generatorUuid,
            quantity: quantity,
            customer_email: customerEmail
        };

        if (customerName) {
            payload.customer_name = customerName;
        }

        const idempotencyKey = options.idempotencyKey || this.generateUuid();

        const response = await this.httpClient.request(
            'POST',
            '/v1/random-assign-license-keys-queued',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        return response;
    }

    /**
     * Assign and activate license key
     * 
     * @param {string} licenseKey - License key
     * @param {string} customerEmail - Customer email
     * @param {string} identifier - Hardware ID or domain
     * @param {Object} options - Additional options (idempotencyKey)
     * @returns {Promise<Object>} Assignment and activation result
     * @throws {Error}
     */
    async assignAndActivateLicenseKey(licenseKey, customerEmail, identifier, options = {}) {
        this.validateLicenseKey(licenseKey);

        if (!customerEmail) {
            throw new Error('Customer email is required');
        }

        if (!identifier) {
            throw new Error('Identifier is required');
        }

        const payload = {
            license_key: licenseKey,
            customer_email: customerEmail,
            identifier: identifier
        };

        if (options.customer_name) {
            payload.customer_name = options.customer_name;
        }

        if (options.metadata) {
            payload.metadata = options.metadata;
        }

        const idempotencyKey = options.idempotencyKey || this.generateUuid();

        const response = await this.httpClient.request(
            'POST',
            '/v1/assign-and-activate-license-key',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        await this.cacheManager.clearByPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Create license key metadata
     * 
     * @param {string} licenseKey - License key
     * @param {string} metaKey - Metadata key
     * @param {*} metaValue - Metadata value
     * @returns {Promise<Object>} Creation result
     * @throws {Error}
     */
    async createLicenseKeyMeta(licenseKey, metaKey, metaValue) {
        this.validateLicenseKey(licenseKey);

        if (!metaKey) {
            throw new Error('Metadata key cannot be empty');
        }

        const response = await this.httpClient.request('POST', '/v1/create-license-key-meta', {
            license_key: licenseKey,
            meta_key: metaKey,
            meta_value: metaValue
        });

        await this.cacheManager.clearByPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Update license key metadata
     * 
     * @param {string} licenseKey - License key
     * @param {string} metaKey - Metadata key
     * @param {*} metaValue - Metadata value
     * @returns {Promise<Object>} Update result
     * @throws {Error}
     */
    async updateLicenseKeyMeta(licenseKey, metaKey, metaValue) {
        this.validateLicenseKey(licenseKey);

        if (!metaKey) {
            throw new Error('Metadata key cannot be empty');
        }

        const response = await this.httpClient.request('POST', '/v1/update-license-key-meta', {
            license_key: licenseKey,
            meta_key: metaKey,
            meta_value: metaValue
        });

        await this.cacheManager.clearByPattern(`license:${licenseKey}:*`);

        return response;
    }

    /**
     * Delete license key metadata
     * 
     * @param {string} licenseKey - License key
     * @param {string} metaKey - Metadata key
     * @returns {Promise<Object>} Deletion result
     * @throws {Error}
     */
    async deleteLicenseKeyMeta(licenseKey, metaKey) {
        this.validateLicenseKey(licenseKey);

        if (!metaKey) {
            throw new Error('Metadata key cannot be empty');
        }

        const response = await this.httpClient.request('POST', '/v1/delete-license-key-meta', {
            license_key: licenseKey,
            meta_key: metaKey
        });

        await this.cacheManager.clearByPattern(`license:${licenseKey}:*`);

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

module.exports = LicenseManager;
