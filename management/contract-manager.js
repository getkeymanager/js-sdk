const crypto = require('crypto');

/**
 * Contract Manager
 * 
 * Handles contract CRUD operations.
 * 
 * @class ContractManager
 */
class ContractManager {
    /**
     * Initialize contract manager
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
     * Get all contracts
     * 
     * @returns {Promise<Object>} Contracts list
     * @throws {Error}
     */
    async getAllContracts() {
        const cacheKey = this.cacheManager.generateKey('contracts', 'all');
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.httpClient.request('GET', '/v1/get-all-contracts');

        await this.cacheManager.set(cacheKey, response);

        return response;
    }

    /**
     * Create contract
     * 
     * @param {Object} contractData - Contract data
     * @param {Object} options - Additional options (idempotencyKey)
     * @returns {Promise<Object>} Created contract
     * @throws {Error}
     */
    async createContract(contractData, options = {}) {
        const required = [
            'contract_key', 'contract_name', 'contract_information',
            'product_id', 'license_keys_quantity', 'status',
            'can_get_info', 'can_generate', 'can_destroy', 'can_destroy_all'
        ];

        for (const field of required) {
            if (contractData[field] === undefined) {
                throw new Error(`Field '${field}' is required`);
            }
        }

        const idempotencyKey = options.idempotencyKey || this.generateUuid();

        const response = await this.httpClient.request(
            'POST',
            '/v1/create-contract',
            contractData,
            { 'Idempotency-Key': idempotencyKey }
        );

        await this.cacheManager.clear();

        return response;
    }

    /**
     * Update contract
     * 
     * @param {number} contractId - Contract ID
     * @param {Object} contractData - Contract data
     * @returns {Promise<Object>} Update result
     * @throws {Error}
     */
    async updateContract(contractId, contractData) {
        if (contractId < 1) {
            throw new Error('Contract ID must be positive');
        }

        const payload = { ...contractData, contract_id: contractId };

        const response = await this.httpClient.request('POST', '/v1/update-contract', payload);

        await this.cacheManager.clear();

        return response;
    }

    /**
     * Delete contract
     * 
     * @param {number} contractId - Contract ID
     * @returns {Promise<Object>} Deletion result
     * @throws {Error}
     */
    async deleteContract(contractId) {
        if (contractId < 1) {
            throw new Error('Contract ID must be positive');
        }

        const response = await this.httpClient.request('POST', '/v1/delete-contract', {
            contract_id: contractId
        });

        await this.cacheManager.clear();

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

module.exports = ContractManager;
