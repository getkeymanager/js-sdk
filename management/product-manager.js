const crypto = require('crypto');

/**
 * Product Manager
 * 
 * Handles product CRUD operations and metadata.
 * 
 * @class ProductManager
 */
class ProductManager {
    /**
     * Initialize product manager
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
     * Create product
     * 
     * @param {string} name - Product name
     * @param {Object} options - Optional parameters (slug, description, status, idempotencyKey)
     * @returns {Promise<Object>} Created product
     * @throws {Error}
     */
    async createProduct(name, options = {}) {
        if (!name) {
            throw new Error('Product name is required');
        }

        const payload = { name: name };

        if (options.slug !== undefined) {
            payload.slug = options.slug;
        }

        if (options.description !== undefined) {
            payload.description = options.description;
        }

        if (options.status !== undefined) {
            payload.status = options.status;
        }

        if (options.changelog_enabled !== undefined) {
            payload.changelog_enabled = options.changelog_enabled;
        }

        if (options.image !== undefined) {
            payload.image = options.image;
        }

        if (options.features !== undefined) {
            payload.features = options.features;
        }

        const idempotencyKey = options.idempotencyKey || this.generateUuid();

        const response = await this.httpClient.request(
            'POST',
            '/v1/create-product',
            payload,
            { 'Idempotency-Key': idempotencyKey }
        );

        return response;
    }

    /**
     * Update product
     * 
     * @param {string} productUuid - Product UUID
     * @param {Object} options - Update parameters (name, description, status)
     * @returns {Promise<Object>} Update result
     * @throws {Error}
     */
    async updateProduct(productUuid, options = {}) {
        if (!productUuid) {
            throw new Error('Product UUID is required');
        }

        const payload = { product_uuid: productUuid };

        if (options.name !== undefined) {
            payload.name = options.name;
        }

        if (options.slug !== undefined) {
            payload.slug = options.slug;
        }

        if (options.description !== undefined) {
            payload.description = options.description;
        }

        if (options.status !== undefined) {
            payload.status = options.status;
        }

        if (options.changelog_enabled !== undefined) {
            payload.changelog_enabled = options.changelog_enabled;
        }

        if (options.features !== undefined) {
            payload.features = options.features;
        }

        const response = await this.httpClient.request('POST', '/v1/update-product', payload);

        return response;
    }

    /**
     * Delete product
     * 
     * @param {string} productUuid - Product UUID
     * @returns {Promise<Object>} Deletion result
     * @throws {Error}
     */
    async deleteProduct(productUuid) {
        if (!productUuid) {
            throw new Error('Product UUID is required');
        }

        const response = await this.httpClient.request('POST', '/v1/delete-product', {
            product_uuid: productUuid
        });

        return response;
    }

    /**
     * Get all products
     * 
     * @returns {Promise<Object>} Products list
     * @throws {Error}
     */
    async getAllProducts() {
        const cacheKey = this.cacheManager.generateKey('products', 'all');
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request('GET', '/v1/get-all-products');

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Create product metadata
     * 
     * @param {string} productUuid - Product UUID
     * @param {string} metaKey - Metadata key
     * @param {*} metaValue - Metadata value
     * @returns {Promise<Object>} Creation result
     * @throws {Error}
     */
    async createProductMeta(productUuid, metaKey, metaValue) {
        if (!productUuid) {
            throw new Error('Product UUID is required');
        }

        if (!metaKey) {
            throw new Error('Metadata key cannot be empty');
        }

        const response = await this.httpClient.request('POST', '/v1/create-product-meta', {
            product_uuid: productUuid,
            meta_key: metaKey,
            meta_value: metaValue
        });

        return response;
    }

    /**
     * Update product metadata
     * 
     * @param {string} productUuid - Product UUID
     * @param {string} metaKey - Metadata key
     * @param {*} metaValue - Metadata value
     * @returns {Promise<Object>} Update result
     * @throws {Error}
     */
    async updateProductMeta(productUuid, metaKey, metaValue) {
        if (!productUuid) {
            throw new Error('Product UUID is required');
        }

        if (!metaKey) {
            throw new Error('Metadata key cannot be empty');
        }

        const response = await this.httpClient.request('POST', '/v1/update-product-meta', {
            product_uuid: productUuid,
            meta_key: metaKey,
            meta_value: metaValue
        });

        return response;
    }

    /**
     * Delete product metadata
     * 
     * @param {string} productUuid - Product UUID
     * @param {string} metaKey - Metadata key
     * @returns {Promise<Object>} Deletion result
     * @throws {Error}
     */
    async deleteProductMeta(productUuid, metaKey) {
        if (!productUuid) {
            throw new Error('Product UUID is required');
        }

        if (!metaKey) {
            throw new Error('Metadata key cannot be empty');
        }

        const response = await this.httpClient.request('POST', '/v1/delete-product-meta', {
            product_uuid: productUuid,
            meta_key: metaKey
        });

        return response;
    }

    /**
     * Get product metadata
     * 
     * Retrieves all product metadata as key-value pairs
     * 
     * @param {string} productUuid - Product UUID
     * @returns {Promise<Object>} Product metadata
     * @throws {Error}
     */
    async getProductMeta(productUuid) {
        if (!productUuid) {
            throw new Error('Product UUID is required');
        }

        const cacheKey = this.cacheManager.generateKey('product_meta', productUuid);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request('GET', '/v1/get-product-meta', {
            product_uuid: productUuid
        });

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Get product with features
     * 
     * Retrieve individual product information with all features.
     * Accepts product_uuid or product_slug.
     * 
     * @param {Object} options - Either { product_uuid: '...' } or { product_slug: '...' }
     * @returns {Promise<Object>} Product information with features
     * @throws {Error}
     */
    async getProduct(options) {
        if (!options.product_uuid && !options.product_slug) {
            throw new Error('Either product_uuid or product_slug is required');
        }

        const params = {};
        if (options.product_uuid) {
            params.product_uuid = options.product_uuid;
        } else if (options.product_slug) {
            params.product_slug = options.product_slug;
        }

        const cacheKey = this.cacheManager.generateKey('product', JSON.stringify(params));
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request('GET', '/v1/get-product', params);

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Get product with changelog
     * 
     * Retrieve product information with changelog entries.
     * Accepts product_uuid or product_slug.
     * 
     * @param {Object} options - Either { product_uuid: '...' } or { product_slug: '...' }
     * @returns {Promise<Object>} Product information with changelog
     * @throws {Error}
     */
    async getProductChangelog(options) {
        if (!options.product_uuid && !options.product_slug) {
            throw new Error('Either product_uuid or product_slug is required');
        }

        const params = {};
        if (options.product_uuid) {
            params.product_uuid = options.product_uuid;
        } else if (options.product_slug) {
            params.product_slug = options.product_slug;
        }

        const cacheKey = this.cacheManager.generateKey('product_changelog', JSON.stringify(params));
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request('GET', '/v1/get-product-changelog', params);

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Get product public key
     * 
     * Retrieve product's cryptographic public key for signature verification.
     * Accepts product_uuid or product_slug.
     * 
     * @param {Object} options - Either { product_uuid: '...' } or { product_slug: '...' }
     * @returns {Promise<Object>} Product public key
     * @throws {Error}
     */
    async getProductPublicKey(options) {
        if (!options.product_uuid && !options.product_slug) {
            throw new Error('Either product_uuid or product_slug is required');
        }

        const params = {};
        if (options.product_uuid) {
            params.product_uuid = options.product_uuid;
        } else if (options.product_slug) {
            params.product_slug = options.product_slug;
        }

        const cacheKey = this.cacheManager.generateKey('product_public_key', JSON.stringify(params));
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request('GET', '/v1/get-product-public-key', params);

        await this.cacheManager.set(cacheKey, response);

        return response;
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

module.exports = ProductManager;
