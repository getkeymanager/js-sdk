const crypto = require('crypto');

/**
 * RSA-4096-SHA256 Signature Verifier
 * 
 * Cryptographically verifies response signatures from the License Management Platform.
 * 
 * @version 1.0.0
 * @license MIT
 */
class SignatureVerifier {
    static MIN_KEY_SIZE = 2048;
    static EXPECTED_KEY_SIZE = 4096;

    constructor(publicKeyPem) {
        if (!publicKeyPem) {
            throw new Error('Public key cannot be empty');
        }

        try {
            this.publicKey = crypto.createPublicKey(publicKeyPem);
            this.validateKey();
        } catch (e) {
            throw new Error('Invalid public key format: ' + e.message);
        }
    }

    /**
     * Verify a signature
     * 
     * @param {string} data - The data that was signed
     * @param {string} signature - Base64-encoded signature
     * @returns {boolean} True if signature is valid
     */
    verify(data, signature) {
        if (!data) {
            throw new Error('Data cannot be empty');
        }

        if (!signature) {
            throw new Error('Signature cannot be empty');
        }

        let binarySignature;
        try {
            binarySignature = Buffer.from(signature, 'base64');
        } catch (e) {
            throw new Error('Invalid base64 signature');
        }

        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(data);
        verifier.end();

        return verifier.verify(this.publicKey, binarySignature);
    }

    /**
     * Verify a signature using constant-time comparison
     * 
     * This method is more secure against timing attacks when comparing
     * sensitive signature data.
     * 
     * @param {string} data - The data that was signed
     * @param {string} signature - Base64-encoded signature
     * @returns {boolean} True if signature is valid
     */
    verifyConstantTime(data, signature) {
        try {
            const isValid = this.verify(data, signature);
            
            // Perform dummy verification to maintain constant time
            const dummySignature = crypto.randomBytes(512).toString('base64');
            try {
                this.verify(data, dummySignature);
            } catch (e) {
                // Ignore
            }
            
            return isValid;
        } catch (e) {
            return false;
        }
    }

    /**
     * Verify JSON response signature
     * 
     * Extracts signature field, canonicalizes JSON, and verifies.
     * 
     * @param {string} jsonResponse - JSON response string
     * @returns {boolean} True if signature is valid
     */
    verifyJsonResponse(jsonResponse) {
        let data;
        
        try {
            data = JSON.parse(jsonResponse);
        } catch (e) {
            throw new Error('Invalid JSON: ' + e.message);
        }

        if (!data.signature) {
            throw new Error('Response does not contain signature field');
        }

        const signature = data.signature;
        delete data.signature;

        const canonicalJson = this.canonicalizeJson(data);

        return this.verify(canonicalJson, signature);
    }

    /**
     * Canonicalize JSON for signature verification
     * 
     * Ensures consistent JSON representation:
     * - Sorted keys
     * - No whitespace
     * - Consistent formatting
     * 
     * @param {Object} data - Data to canonicalize
     * @returns {string} Canonical JSON
     */
    canonicalizeJson(data) {
        const sorted = this.sortKeysRecursive(data);
        return JSON.stringify(sorted);
    }

    /**
     * Get key information
     * 
     * @returns {Object} Key details
     */
    getKeyInfo() {
        const keyDetails = this.publicKey.export({ format: 'jwk' });
        
        return {
            type: this.publicKey.asymmetricKeyType,
            size: keyDetails.n ? Buffer.from(keyDetails.n, 'base64').length * 8 : null
        };
    }

    /**
     * Validate key meets security requirements
     * 
     * @private
     */
    validateKey() {
        if (this.publicKey.asymmetricKeyType !== 'rsa') {
            throw new Error('Key must be RSA type');
        }

        const keyInfo = this.getKeyInfo();
        const bits = keyInfo.size;

        if (bits < SignatureVerifier.MIN_KEY_SIZE) {
            throw new Error(
                `Key size must be at least ${SignatureVerifier.MIN_KEY_SIZE} bits (got ${bits})`
            );
        }

        if (bits < SignatureVerifier.EXPECTED_KEY_SIZE) {
            console.warn(
                `Warning: Key size is ${bits} bits. Expected ${SignatureVerifier.EXPECTED_KEY_SIZE} bits.`
            );
        }
    }

    /**
     * Recursively sort object keys
     * 
     * @private
     */
    sortKeysRecursive(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.sortKeysRecursive(item));
        }
        
        if (data !== null && typeof data === 'object') {
            const sorted = {};
            const keys = Object.keys(data).sort();
            
            for (const key of keys) {
                sorted[key] = this.sortKeysRecursive(data[key]);
            }
            
            return sorted;
        }
        
        return data;
    }
}

module.exports = SignatureVerifier;
