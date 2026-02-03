const EntitlementState = require('./entitlement-state');
const LicenseState = require('./license-state');
const { SignatureError, ValidationError } = require('./exceptions');

/**
 * StateResolver - Resolves EntitlementState from API Responses
 * 
 * Transforms API validation responses into EntitlementState objects
 * with proper signature verification.
 * 
 * @internal This class is for internal SDK use only
 */
class StateResolver {
    constructor(verifier = null, environment = null, productId = null) {
        this.verifier = verifier;
        this.environment = environment;
        this.productId = productId;
    }

    resolveFromValidation(response, licenseKey = null) {
        // Verify signature if available
        let signature = null;
        if (response.signature && this.verifier) {
            signature = response.signature;
            this.verifySignature(response, signature);
        }

        // Extract and normalize payload
        const payload = this.normalizeValidationPayload(response);
        
        // Add context
        payload.environment = this.environment;
        payload.product_id = this.productId;
        payload.issued_at = response.timestamp || Date.now() / 1000;

        // Create EntitlementState
        const entitlementState = new EntitlementState(payload, signature);

        // Wrap in public LicenseState
        return new LicenseState(entitlementState, licenseKey);
    }

    resolveFromFeatureCheck(response, licenseKey = null) {
        const signature = response.signature || null;
        if (signature && this.verifier) {
            this.verifySignature(response, signature);
        }

        const payload = {
            valid: response.enabled || false,
            features: {
                [response.feature || 'unknown']: response.value !== undefined ? response.value : response.enabled || false
            },
            issued_at: response.timestamp || Date.now() / 1000,
            environment: this.environment,
            product_id: this.productId
        };

        const entitlementState = new EntitlementState(payload, signature);
        return new LicenseState(entitlementState, licenseKey);
    }

    resolveFromActivation(response, licenseKey = null) {
        const signature = response.signature || null;
        if (signature && this.verifier) {
            this.verifySignature(response, signature);
        }

        const payload = {
            valid: response.success || false,
            status: 'active',
            issued_at: response.timestamp || Date.now() / 1000,
            environment: this.environment,
            product_id: this.productId
        };

        // Extract activation details
        if (response.activation) {
            if (response.activation.hardware_id) {
                const crypto = require('crypto');
                payload.context_binding = crypto
                    .createHash('sha256')
                    .update(response.activation.hardware_id)
                    .digest('hex');
            }
            
            if (response.activation.activated_at) {
                payload.valid_from = new Date(response.activation.activated_at).getTime() / 1000;
            }
        }

        const entitlementState = new EntitlementState(payload, signature);
        return new LicenseState(entitlementState, licenseKey);
    }

    createRestrictedState(reason, licenseKey = null) {
        const payload = {
            valid: false,
            status: 'restricted',
            metadata: { reason },
            issued_at: Date.now() / 1000,
            environment: this.environment,
            product_id: this.productId
        };

        const entitlementState = new EntitlementState(payload);
        return new LicenseState(entitlementState, licenseKey);
    }

    createGraceState(lastValidState, licenseKey = null) {
        const payload = {
            ...lastValidState,
            revalidation_failed: true,
            last_verified_at: lastValidState.last_verified_at || Date.now() / 1000
        };

        const signature = lastValidState.signature || null;
        const entitlementState = new EntitlementState(payload, signature);
        
        return new LicenseState(entitlementState, licenseKey);
    }

    normalizeValidationPayload(response) {
        const payload = {};

        // Handle response.data structure
        if (response.data) {
            const data = response.data;
            
            payload.valid = data.valid || false;
            
            if (data.license) {
                const license = data.license;
                
                payload.status = license.status || null;
                payload.features = license.features || {};
                payload.metadata = license.metadata || {};
                
                // Extract validity window
                if (license.expires_at) {
                    payload.valid_until = license.expires_at 
                        ? new Date(license.expires_at).getTime() / 1000
                        : null;
                }

                if (license.activated_at) {
                    payload.valid_from = new Date(license.activated_at).getTime() / 1000;
                }

                // Extract context binding
                if (license.hardware_id) {
                    const crypto = require('crypto');
                    payload.context_binding = crypto
                        .createHash('sha256')
                        .update(license.hardware_id)
                        .digest('hex');
                } else if (license.domain) {
                    const crypto = require('crypto');
                    payload.context_binding = crypto
                        .createHash('sha256')
                        .update(license.domain)
                        .digest('hex');
                }
            }
        } else {
            // Direct response format
            payload.valid = response.valid || false;
            
            if (response.license) {
                const license = response.license;
                payload.status = license.status || null;
                payload.features = license.features || {};
                payload.metadata = license.metadata || {};
                
                if (license.expires_at) {
                    payload.valid_until = license.expires_at 
                        ? new Date(license.expires_at).getTime() / 1000
                        : null;
                }
            }
        }

        return payload;
    }

    verifySignature(response, signature) {
        if (!this.verifier) {
            return;
        }

        // Remove signature from response for verification
        const responseForVerification = { ...response };
        delete responseForVerification.signature;

        const payload = JSON.stringify(responseForVerification);
        
        if (!this.verifier.verify(payload, signature)) {
            throw new SignatureError('Response signature verification failed');
        }
    }
}

module.exports = StateResolver;
