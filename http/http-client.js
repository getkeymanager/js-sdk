/**
 * HTTP Client
 * 
 * Handles all HTTP requests to the API with retry logic and error handling.
 * 
 * @module Http/HttpClient
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { NetworkException, LicenseException, SignatureException } = require('../exceptions');
const ApiResponseCode = require('../api-response-code');

/**
 * HTTP Client for API requests
 */
class HttpClient {
    static VERSION = '2.0.0';

    /**
     * Initialize HTTP client
     * 
     * @param {Configuration} config - SDK configuration
     * @param {SignatureVerifier|null} signatureVerifier - Optional signature verifier
     * @param {StateResolver|null} stateResolver - Optional state resolver for exception handling
     */
    constructor(config, signatureVerifier = null, stateResolver = null) {
        this._config = config;
        this._signatureVerifier = signatureVerifier;
        this._stateResolver = stateResolver;
    }

    /**
     * Make authenticated API request
     * 
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object|null} data - Request payload
     * @param {Object} extraHeaders - Additional headers
     * @returns {Promise<Object>} Response data
     * @throws {NetworkException} On network errors
     * @throws {LicenseException} On API errors
     */
    async request(method, endpoint, data = null, extraHeaders = {}) {
        let url = new URL(endpoint, this._config.getBaseUrl());
        
        // Add api_key as a fallback/redundancy
        if (method.toUpperCase() === 'GET') {
            url.searchParams.append('api_key', this._config.getApiKey());
        } else if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            data = data || {};
            data.api_key = this._config.getApiKey();
        }

        const headers = {
            'Authorization': `Bearer ${this._config.getApiKey()}`, // Send as Bearer token to match middleware
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': `GetKeyManager-JS-SDK/${HttpClient.VERSION}`,
            ...extraHeaders
        };

        let attempt = 0;
        let lastException = null;

        while (attempt < this._config.getRetryAttempts()) {
            try {
                const response = await this._makeHttpRequest(method, url, headers, data);
                
                // Handle rate limiting with retry
                if (response.statusCode === 429) {
                    const retryAfter = (response.data.retry_after || this._config.getRetryDelay() / 1000) * 1000;
                    await this._sleep(retryAfter);
                    attempt++;
                    continue;
                }

                // Handle successful response
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    // Verify signature if enabled and present
                    if (this._config.shouldVerifySignatures() && response.data.signature) {
                        this._verifyResponse(response.data);
                    }
                    
                    return response.data.data || response.data;
                }

                // Handle error response
                this._handleErrorResponse(response.statusCode, response.data);
                
            } catch (e) {
                if (e instanceof NetworkException) {
                    lastException = e;
                    attempt++;
                    if (attempt < this._config.getRetryAttempts()) {
                        await this._sleep(this._config.getRetryDelay() * attempt);
                    }
                } else {
                    throw e; // Re-throw non-network exceptions
                }
            }
        }

        throw lastException || new NetworkException(
            `Request failed after ${this._config.getRetryAttempts()} retries`,
            0,
            NetworkException.ERROR_NETWORK_ERROR
        );
    }

    /**
     * Make public (non-authenticated) API request
     * 
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     * @throws {NetworkException} On network errors
     * @throws {LicenseException} On API errors
     */
    async requestPublic(method, endpoint) {
        const url = new URL(endpoint, this._config.getBaseUrl());
        
        const headers = {
            'Accept': 'application/json',
            'User-Agent': `GetKeyManager-JS-SDK/${HttpClient.VERSION}`
        };

        const response = await this._makeHttpRequest(method, url, headers, null);

        if (response.statusCode >= 200 && response.statusCode < 300) {
            return response.data;
        }

        throw new LicenseException('Failed to fetch public data', response.statusCode);
    }

    /**
     * Make HTTP request
     * 
     * @param {string} method - HTTP method
     * @param {URL} url - Request URL
     * @param {Object} headers - Request headers
     * @param {Object|null} data - Request body data
     * @returns {Promise<Object>} Response with statusCode and data
     * @private
     */
    _makeHttpRequest(method, url, headers, data) {
        return new Promise((resolve, reject) => {
            const protocol = url.protocol === 'https:' ? https : http;
            
            const options = {
                method,
                headers,
                timeout: this._config.getTimeout()
            };

            const req = protocol.request(url, options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const responseData = JSON.parse(body);
                        resolve({
                            statusCode: res.statusCode,
                            data: responseData
                        });
                    } catch (e) {
                        reject(new NetworkException(
                            'Invalid JSON response from API',
                            0,
                            NetworkException.ERROR_INVALID_RESPONSE
                        ));
                    }
                });
            });

            req.on('error', (e) => {
                reject(new NetworkException(
                    'Network error: ' + e.message,
                    0,
                    NetworkException.ERROR_NETWORK_ERROR
                ));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new NetworkException(
                    'Request timeout',
                    0,
                    NetworkException.ERROR_TIMEOUT
                ));
            });

            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Handle error response from API
     * 
     * @param {number} httpCode - HTTP status code
     * @param {Object} responseData - Response data
     * @throws {LicenseException}
     * @private
     */
    _handleErrorResponse(httpCode, responseData) {
        // Check if response has the standard structure with response.code
        if (responseData.response && responseData.response.code !== undefined) {
            const apiCode = responseData.response.code;
            
            // Use StateResolver for proper exception mapping if available
            if (this._stateResolver) {
                this._stateResolver.throwExceptionForResponse(responseData);
            }
            
            // Fallback: throw generic exception with API code info
            const message = responseData.response.message || ApiResponseCode.getMessage(apiCode);
            const codeName = ApiResponseCode.getName(apiCode);
            
            const exception = new LicenseException(
                message,
                httpCode,
                codeName,
                responseData.response.data || {},
                null,
                apiCode
            );
            exception.setResponseData(responseData);
            throw exception;
        }
        
        // Legacy error format support
        if (responseData.error) {
            const error = responseData.error;
            const code = error.code || 'UNKNOWN_ERROR';
            const message = error.message || 'An error occurred';
            
            throw new LicenseException(message, httpCode, code, error);
        }

        // Generic error
        throw new LicenseException(
            'API request failed',
            httpCode,
            'API_ERROR',
            responseData
        );
    }

    /**
     * Verify response signature
     * 
     * @param {Object} response - Response data
     * @throws {SignatureException}
     * @private
     */
    _verifyResponse(response) {
        if (!this._signatureVerifier) {
            return;
        }

        if (!response.signature) {
            return;
        }

        const signature = response.signature;
        const responseWithoutSignature = { ...response };
        delete responseWithoutSignature.signature;

        const payload = JSON.stringify(responseWithoutSignature);
        
        if (!this._signatureVerifier.verify(payload, signature)) {
            throw new SignatureException(
                'Response signature verification failed',
                0,
                SignatureException.ERROR_SIGNATURE_VERIFICATION_FAILED
            );
        }
    }

    /**
     * Sleep for specified milliseconds
     * 
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = HttpClient;
