/**
 * LicenseState - Public License State API
 * 
 * Public-facing API for checking license state and capabilities.
 */
class LicenseState {
    constructor(entitlementState, licenseKey = null) {
        this.entitlementState = entitlementState;
        this.licenseKey = licenseKey;
    }

    isValid() {
        return this.entitlementState.allowsOperation();
    }

    isActive() {
        return this.entitlementState.isActive();
    }

    isInGracePeriod() {
        return this.entitlementState.isInGrace();
    }

    isExpired() {
        return this.entitlementState.isExpired();
    }

    allows(feature) {
        return this.entitlementState.hasCapability(feature);
    }

    getFeatureValue(feature) {
        return this.entitlementState.getCapabilityValue(feature);
    }

    canUpdate() {
        return this.allows('updates');
    }

    canDownload() {
        return this.allows('downloads');
    }

    canSendTelemetry() {
        return this.allows('telemetry');
    }

    getState() {
        return this.entitlementState.getState();
    }

    getStatusMessage() {
        const EntitlementState = require('./entitlement-state');
        const state = this.entitlementState.getState();

        switch (state) {
            case EntitlementState.STATE_ACTIVE:
                return 'License is active and valid';
            case EntitlementState.STATE_GRACE:
                return 'License is in grace period - please revalidate soon';
            case EntitlementState.STATE_RESTRICTED:
                return 'License is restricted - activation or validation required';
            case EntitlementState.STATE_INVALID:
                return 'License is invalid or has been revoked';
            default:
                return 'License status unknown';
        }
    }

    getExpiresAt() {
        const validity = this.entitlementState.getValidityWindow();
        return validity.until;
    }

    getDaysUntilExpiration() {
        const expiresAt = this.getExpiresAt();
        
        if (expiresAt === null) {
            return null; // Lifetime
        }

        const diff = expiresAt - (Date.now() / 1000);
        return Math.floor(diff / 86400);
    }

    needsRevalidation(intervalSeconds = 86400) {
        return this.entitlementState.needsRevalidation(intervalSeconds);
    }

    getFeatures() {
        return this.entitlementState.getCapabilities();
    }

    getMetadata() {
        return this.entitlementState.getMetadata();
    }

    getLicenseKey() {
        return this.licenseKey;
    }

    verifyContext(context) {
        return this.entitlementState.verifyContextBinding(context);
    }

    getEntitlementState() {
        return this.entitlementState;
    }

    toObject() {
        return {
            license_key: this.licenseKey,
            is_valid: this.isValid(),
            is_active: this.isActive(),
            is_in_grace_period: this.isInGracePeriod(),
            is_expired: this.isExpired(),
            state: this.getState(),
            status_message: this.getStatusMessage(),
            expires_at: this.getExpiresAt(),
            days_until_expiration: this.getDaysUntilExpiration(),
            features: this.getFeatures(),
            metadata: this.getMetadata()
        };
    }

    toJSON() {
        return JSON.stringify(this.toObject(), null, 2);
    }

    toString() {
        return this.getStatusMessage();
    }
}

module.exports = LicenseState;
