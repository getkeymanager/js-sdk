/**
 * Telemetry Client
 * 
 * Handles telemetry data submission and retrieval.
 * 
 * @class TelemetryClient
 */
class TelemetryClient {
    /**
     * Initialize telemetry client
     * 
     * @param {Object} httpClient - HTTP client instance
     */
    constructor(httpClient) {
        if (!httpClient) {
            throw new Error('httpClient is required');
        }
        this.httpClient = httpClient;
    }

    /**
     * Send telemetry data
     * 
     * @param {string} dataType - Data type: numeric-single-value, numeric-xy-axis, or text
     * @param {string} dataGroup - Data group/category
     * @param {Object} dataValues - Data values based on type
     * @param {Object} options - Optional parameters (license_key, activation_identifier, user_identifier, product_id, product_version)
     * @returns {Promise<Object>} Result
     */
    async sendTelemetry(dataType, dataGroup, dataValues = {}, options = {}) {
        try {
            // Validate data type
            const validDataTypes = ['numeric-single-value', 'numeric-xy-axis', 'text'];
            if (!validDataTypes.includes(dataType)) {
                throw new Error(`Invalid data_type. Must be one of: ${validDataTypes.join(', ')}`);
            }

            // Build payload based on data type
            const data = {
                data_type: dataType,
                data_group: dataGroup
            };

            // Add conditional data fields based on type
            switch (dataType) {
                case 'numeric-single-value':
                    if (dataValues.value === undefined) {
                        throw new Error('numeric_data_single_value is required for numeric-single-value type');
                    }
                    data.numeric_data_single_value = dataValues.value;
                    break;
                case 'numeric-xy-axis':
                    if (dataValues.x === undefined || dataValues.y === undefined) {
                        throw new Error('numeric_data_x and numeric_data_y are required for numeric-xy-axis type');
                    }
                    data.numeric_data_x = dataValues.x;
                    data.numeric_data_y = dataValues.y;
                    break;
                case 'text':
                    if (dataValues.text === undefined) {
                        throw new Error('text_data is required for text type');
                    }
                    data.text_data = dataValues.text;
                    break;
            }

            // Add optional context fields
            if (options.license_key) {
                data.license_key = options.license_key;
            }
            if (options.activation_identifier) {
                data.activation_identifier = options.activation_identifier;
            }
            if (options.user_identifier) {
                data.user_identifier = options.user_identifier;
            }
            if (options.product_id) {
                data.product_id = options.product_id;
            }
            if (options.product_version) {
                data.product_version = options.product_version;
            }

            const response = await this.httpClient.request('POST', '/v1/send-telemetry', data);

            return {
                success: true,
                telemetry_id: response.telemetry_id || null,
                is_flagged: response.is_flagged || false
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get telemetry data
     * 
     * @param {string} dataType - Data type (numeric-single-value, numeric-xy-axis, text)
     * @param {string} dataGroup - Data group
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Telemetry data
     * @throws {Error}
     */
    async getTelemetryData(dataType, dataGroup, filters = {}) {
        if (!dataType || !dataGroup) {
            throw new Error('Data type and data group are required');
        }

        const queryParams = {
            data_type: dataType,
            data_group: dataGroup
        };

        if (filters.product_id !== undefined) {
            queryParams.product_id = filters.product_id;
        }

        if (filters.user_identifier !== undefined) {
            queryParams.user_identifier = filters.user_identifier;
        }

        if (filters.license_key !== undefined) {
            queryParams.license_key = filters.license_key;
        }

        if (filters.has_red_flags !== undefined) {
            queryParams.has_red_flags = filters.has_red_flags;
        }

        const query = new URLSearchParams(queryParams).toString();
        const endpoint = `/v1/get-telemetry-data?${query}`;

        const response = await this.httpClient.request('GET', endpoint);

        return response;
    }
}

module.exports = TelemetryClient;
