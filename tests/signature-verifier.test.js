const SignatureVerifier = require('../signature-verifier');

describe('SignatureVerifier', () => {
    const testPublicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtest
-----END PUBLIC KEY-----`;

    describe('Constructor', () => {
        test('should throw error when public key is empty', () => {
            expect(() => new SignatureVerifier('')).toThrow();
        });

        test('should throw error when public key is null', () => {
            expect(() => new SignatureVerifier(null)).toThrow();
        });

        test('should accept valid public key', () => {
            const verifier = new SignatureVerifier(testPublicKey);
            expect(verifier).toBeInstanceOf(SignatureVerifier);
        });
    });

    describe('verify', () => {
        let verifier;

        beforeEach(() => {
            verifier = new SignatureVerifier(testPublicKey);
        });

        test('should return false for invalid signature', () => {
            const data = '{"test":"data"}';
            const signature = 'invalid_signature';

            const result = verifier.verify(data, signature);
            expect(result).toBe(false);
        });

        test('should handle empty data', () => {
            const signature = 'test_signature';
            const result = verifier.verify('', signature);
            expect(result).toBe(false);
        });
    });

    describe('verifyJsonResponse', () => {
        let verifier;

        beforeEach(() => {
            verifier = new SignatureVerifier(testPublicKey);
        });

        test('should throw error for invalid JSON', () => {
            expect(() => verifier.verifyJsonResponse('invalid json')).toThrow();
        });

        test('should throw error for missing signature', () => {
            const jsonResponse = '{"data":{"test":"value"}}';
            expect(() => verifier.verifyJsonResponse(jsonResponse)).toThrow();
        });

        test('should accept valid JSON with signature', () => {
            const jsonResponse = '{"data":{"test":"value"},"signature":"test_sig"}';
            // Will return false due to invalid signature, but shouldn't throw
            const result = verifier.verifyJsonResponse(jsonResponse);
            expect(typeof result).toBe('boolean');
        });
    });

    describe('canonicalizeJson', () => {
        let verifier;

        beforeEach(() => {
            verifier = new SignatureVerifier(testPublicKey);
        });

        test('should produce consistent output', () => {
            const data1 = { z: 'value', a: 'another' };
            const data2 = { a: 'another', z: 'value' };

            const canonical1 = verifier.canonicalizeJson(data1);
            const canonical2 = verifier.canonicalizeJson(data2);

            expect(canonical1).toBe(canonical2);
        });

        test('should handle nested objects', () => {
            const data = {
                nested: { b: 1, a: 2 },
                top: 'level'
            };

            const canonical = verifier.canonicalizeJson(data);
            expect(typeof canonical).toBe('string');
            expect(canonical).toContain('"a":');
            expect(canonical).toContain('"b":');
        });
    });
});
