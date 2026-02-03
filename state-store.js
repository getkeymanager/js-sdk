const EntitlementState = require('./entitlement-state');
const { SignatureError } = require('./exceptions');

/**
 * StateStore - Internal State Cache Manager
 * 
 * Manages cached EntitlementState with signature verification on every read.
 * 
 * @internal This class is for internal SDK use only
 */
class StateStore {
    constructor(verifier = null, defaultTtl = 300) {
        this.store = new Map();
        this.verifier = verifier;
        this.defaultTtl = defaultTtl;
    }

    set(key, state, ttl = null) {
        ttl = ttl || this.defaultTtl;
        
        this.store.set(key, {
            state: state.toObject(),
            expiresAt: Date.now() / 1000 + ttl
        });
    }

    get(key) {
        if (!this.store.has(key)) {
            return null;
        }

        const cached = this.store.get(key);

        // Check TTL expiration
        if (cached.expiresAt < Date.now() / 1000) {
            this.store.delete(key);
            return null;
        }

        // Verify signature on every read
        try {
            return EntitlementState.fromCache(cached.state, this.verifier);
        } catch (error) {
            // Invalid signature - remove from cache
            this.store.delete(key);
            throw error;
        }
    }

    has(key) {
        if (!this.store.has(key)) {
            return false;
        }

        const cached = this.store.get(key);
        
        if (cached.expiresAt < Date.now() / 1000) {
            this.store.delete(key);
            return false;
        }

        return true;
    }

    remove(key) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }

    clearLicense(licenseKey) {
        const prefix = this.getLicenseKeyPrefix(licenseKey);
        
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }

    getValidationKey(licenseKey) {
        return `entitlement:${licenseKey}:validation`;
    }

    getFeatureKey(licenseKey, feature) {
        return `entitlement:${licenseKey}:feature:${feature}`;
    }

    getLicenseKeyPrefix(licenseKey) {
        return `entitlement:${licenseKey}:`;
    }

    gc() {
        let count = 0;
        const now = Date.now() / 1000;

        for (const [key, cached] of this.store.entries()) {
            if (cached.expiresAt < now) {
                this.store.delete(key);
                count++;
            }
        }

        return count;
    }

    getStats() {
        const now = Date.now() / 1000;
        let expired = 0;
        let active = 0;

        for (const cached of this.store.values()) {
            if (cached.expiresAt < now) {
                expired++;
            } else {
                active++;
            }
        }

        return {
            total: this.store.size,
            active,
            expired
        };
    }
}

module.exports = StateStore;
