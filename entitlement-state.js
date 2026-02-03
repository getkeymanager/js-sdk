/**
 * EntitlementState - Internal State Representation
 * 
 * Internal entitlement state representation using domain-agnostic terminology.
 * 
 * @internal This class is for internal SDK use only
 */
class EntitlementState {
    // State constants
    static STATE_ACTIVE = 'ACTIVE';
    static STATE_GRACE = 'GRACE';
    static STATE_RESTRICTED = 'RESTRICTED';
    static STATE_INVALID = 'INVALID';

    constructor(payload, signature = null) {
        this.validatePayload(payload);
        
        this.state = this.determineState(payload);
        this.capabilities = this.extractCapabilities(payload);
        this.validFrom = payload.valid_from || null;
        this.validUntil = payload.valid_until || null;
        this.contextBinding = payload.context_binding || null;
        this.productId = payload.product_id || null;
        this.environment = payload.environment || null;
        this.metadata = payload.metadata || {};
        this.signature = signature;
        this.issuedAt = payload.issued_at || Date.now() / 1000;
        this.lastVerifiedAt = Date.now() / 1000;
    }

    /**
     * Create from cached data (must verify signature)
     */
    static fromCache(cachedData, verifier = null) {
        if (!cachedData.signature) {
            throw new SignatureError('Cached state missing signature');
        }

        // Verify signature on every read
        if (verifier) {
            const signature = cachedData.signature;
            const dataWithoutSig = { ...cachedData };
            delete dataWithoutSig.signature;
            
            const payload = JSON.stringify(dataWithoutSig);
            if (!verifier.verify(payload, signature)) {
                throw new SignatureError('Cached state signature verification failed');
            }
        }

        return new EntitlementState(cachedData, cachedData.signature);
    }

    hasCapability(capability) {
        return this.capabilities[capability] === true;
    }

    getCapabilityValue(capability) {
        return this.capabilities[capability] || null;
    }

    isActive() {
        return this.state === EntitlementState.STATE_ACTIVE;
    }

    isInGrace() {
        return this.state === EntitlementState.STATE_GRACE;
    }

    allowsOperation() {
        return this.state === EntitlementState.STATE_ACTIVE || 
               this.state === EntitlementState.STATE_GRACE;
    }

    isExpired() {
        if (this.validUntil === null) {
            return false; // Lifetime license
        }
        return Date.now() / 1000 > this.validUntil;
    }

    needsRevalidation(revalidationInterval = 86400) {
        return (Date.now() / 1000 - this.lastVerifiedAt) > revalidationInterval;
    }

    getState() {
        return this.state;
    }

    getCapabilities() {
        return { ...this.capabilities };
    }

    getValidityWindow() {
        return {
            from: this.validFrom,
            until: this.validUntil
        };
    }

    getContextBinding() {
        return this.contextBinding;
    }

    verifyContextBinding(context) {
        if (this.contextBinding === null) {
            return true; // Not bound
        }
        const crypto = require('crypto');
        const contextHash = crypto.createHash('sha256').update(context).digest('hex');
        return contextHash === this.contextBinding;
    }

    getMetadata() {
        return { ...this.metadata };
    }

    toObject() {
        return {
            state: this.state,
            capabilities: this.capabilities,
            valid_from: this.validFrom,
            valid_until: this.validUntil,
            context_binding: this.contextBinding,
            product_id: this.productId,
            environment: this.environment,
            metadata: this.metadata,
            signature: this.signature,
            issued_at: this.issuedAt,
            last_verified_at: this.lastVerifiedAt
        };
    }

    validatePayload(payload) {
        // Basic validation
        if (typeof payload !== 'object') {
            throw new Error('Invalid payload: must be an object');
        }
    }

    determineState(payload) {
        // Check if license data indicates invalid state
        if (payload.status) {
            const status = payload.status.toLowerCase();
            if (['revoked', 'suspended', 'cancelled'].includes(status)) {
                return EntitlementState.STATE_INVALID;
            }
        }

        // Check validity window
        const now = Date.now() / 1000;
        
        if (payload.valid_from && now < payload.valid_from) {
            return EntitlementState.STATE_RESTRICTED;
        }

        if (payload.valid_until && now > payload.valid_until) {
            // Check if within grace period (7 days)
            const gracePeriod = 7 * 86400;
            if ((now - payload.valid_until) < gracePeriod) {
                return EntitlementState.STATE_GRACE;
            }
            return EntitlementState.STATE_RESTRICTED;
        }

        // Check if validation succeeded
        if (payload.valid === true) {
            return EntitlementState.STATE_ACTIVE;
        }

        // Check revalidation failure with grace
        if (payload.revalidation_failed === true) {
            const lastVerified = payload.last_verified_at || 0;
            const graceWindow = 72 * 3600; // 72 hours
            
            if ((Date.now() / 1000 - lastVerified) < graceWindow) {
                return EntitlementState.STATE_GRACE;
            }
        }

        return EntitlementState.STATE_ACTIVE;
    }

    extractCapabilities(payload) {
        const capabilities = {};

        // Extract from features field
        if (payload.features && typeof payload.features === 'object') {
            Object.assign(capabilities, payload.features);
        }

        // Extract from license.features
        if (payload.license && payload.license.features) {
            Object.assign(capabilities, payload.license.features);
        }

        // Add standard capabilities
        capabilities.updates = this.determineUpdateCapability(payload);
        capabilities.telemetry = this.determineTelemetryCapability(payload);
        capabilities.downloads = this.determineDownloadCapability(payload);

        // Extract limits
        if (payload.license) {
            if (payload.license.activations_limit !== undefined) {
                capabilities.max_activations = payload.license.activations_limit;
            }
            if (payload.license.activations_count !== undefined) {
                capabilities.current_activations = payload.license.activations_count;
            }
        }

        return capabilities;
    }

    determineUpdateCapability(payload) {
        if (payload.valid === false) return false;
        if (payload.license && payload.license.status) {
            const status = payload.license.status.toLowerCase();
            if (['revoked', 'suspended'].includes(status)) return false;
        }
        return true;
    }

    determineTelemetryCapability(payload) {
        if (payload.features && payload.features.telemetry !== undefined) {
            return Boolean(payload.features.telemetry);
        }
        return true; // Default enabled
    }

    determineDownloadCapability(payload) {
        if (payload.license && payload.license.status) {
            const status = payload.license.status.toLowerCase();
            return ['active', 'assigned', 'available'].includes(status);
        }
        return payload.valid === true;
    }
}

module.exports = EntitlementState;
