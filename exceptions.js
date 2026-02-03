/**
 * Enhanced Exception Classes for JavaScript SDK
 */

class LicenseError extends Error {
    constructor(message = '', code = 0, errorCode = null, errorDetails = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.errorCode = errorCode;
        this.errorDetails = errorDetails;
        this.responseData = null;
        Error.captureStackTrace(this, this.constructor);
    }

    getErrorCode() {
        return this.errorCode;
    }

    getErrorDetails() {
        return { ...this.errorDetails };
    }

    setResponseData(responseData) {
        this.responseData = responseData;
        return this;
    }

    getResponseData() {
        return this.responseData;
    }

    isErrorCode(errorCode) {
        return this.errorCode === errorCode;
    }

    getUserMessage() {
        return this.message;
    }

    toObject() {
        return {
            exception: this.name,
            message: this.message,
            code: this.code,
            error_code: this.errorCode,
            details: this.errorDetails,
            stack: this.stack
        };
    }
}

class ValidationError extends LicenseError {
    static ERROR_INVALID_LICENSE_KEY = 'INVALID_LICENSE_KEY';
    static ERROR_INVALID_API_KEY = 'INVALID_API_KEY';
    static ERROR_VALIDATION_ERROR = 'VALIDATION_ERROR';
    static ERROR_MISSING_PARAMETER = 'MISSING_PARAMETER';
}

class NetworkError extends LicenseError {
    static ERROR_NETWORK_ERROR = 'NETWORK_ERROR';
    static ERROR_TIMEOUT_ERROR = 'TIMEOUT_ERROR';
    static ERROR_CONNECTION_ERROR = 'CONNECTION_ERROR';
    static ERROR_DNS_ERROR = 'DNS_ERROR';
}

class SignatureError extends LicenseError {
    static ERROR_SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED';
    static ERROR_SIGNATURE_MISSING = 'SIGNATURE_MISSING';
    static ERROR_INVALID_PUBLIC_KEY = 'INVALID_PUBLIC_KEY';
}

class RateLimitError extends LicenseError {
    static ERROR_RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED';
    
    constructor(message, code, errorCode, errorDetails, retryAfter = null) {
        super(message, code, errorCode, errorDetails);
        this.retryAfter = retryAfter;
    }

    setRetryAfter(seconds) {
        this.retryAfter = seconds;
        return this;
    }

    getRetryAfter() {
        return this.retryAfter;
    }
}

class LicenseStatusError extends LicenseError {}

class ExpiredError extends LicenseStatusError {
    static ERROR_LICENSE_EXPIRED = 'LICENSE_EXPIRED';
    
    constructor(message, code, errorCode, errorDetails, expiredAt = null) {
        super(message, code, errorCode, errorDetails);
        this.expiredAt = expiredAt;
    }

    setExpiredAt(timestamp) {
        this.expiredAt = timestamp;
        return this;
    }

    getExpiredAt() {
        return this.expiredAt;
    }

    getDaysSinceExpiration() {
        if (this.expiredAt === null) {
            return 0;
        }
        const diff = Date.now() / 1000 - this.expiredAt;
        return Math.floor(diff / 86400);
    }
}

class SuspendedError extends LicenseStatusError {
    static ERROR_LICENSE_SUSPENDED = 'LICENSE_SUSPENDED';
}

class RevokedError extends LicenseStatusError {
    static ERROR_LICENSE_REVOKED = 'LICENSE_REVOKED';
}

class ActivationError extends LicenseError {
    static ERROR_ACTIVATION_LIMIT_REACHED = 'ACTIVATION_LIMIT_REACHED';
    static ERROR_ALREADY_ACTIVATED = 'ALREADY_ACTIVATED';
    static ERROR_NOT_ACTIVATED = 'NOT_ACTIVATED';
    static ERROR_HARDWARE_MISMATCH = 'HARDWARE_MISMATCH';
    static ERROR_DOMAIN_MISMATCH = 'DOMAIN_MISMATCH';
}

class FeatureError extends LicenseError {
    static ERROR_FEATURE_NOT_FOUND = 'FEATURE_NOT_FOUND';
    static ERROR_FEATURE_DISABLED = 'FEATURE_DISABLED';
    static ERROR_FEATURE_LIMIT_EXCEEDED = 'FEATURE_LIMIT_EXCEEDED';
}

class StateError extends LicenseError {
    static ERROR_INVALID_STATE = 'INVALID_STATE';
    static ERROR_STATE_TRANSITION_NOT_ALLOWED = 'STATE_TRANSITION_NOT_ALLOWED';
    static ERROR_GRACE_PERIOD_EXPIRED = 'GRACE_PERIOD_EXPIRED';
}

module.exports = {
    LicenseError,
    ValidationError,
    NetworkError,
    SignatureError,
    RateLimitError,
    LicenseStatusError,
    ExpiredError,
    SuspendedError,
    RevokedError,
    ActivationError,
    FeatureError,
    StateError
};
