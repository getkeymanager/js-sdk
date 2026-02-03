const SignatureVerifier = require('../signature-verifier');

describe('SignatureVerifier', () => {
    const testPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs7YomalLburtHvOhxAn1
Uu6RkoReGYdb1MABFZ6Vp+P6chFCdNrODCJ6lpaTYmrxEIxsnm7SxUoT7iYSc7o5
gQtfrmoesJcmzashDdHbdK7zyCJDPKBxPaZeR1Ly6dYqxVYF2aewYlSlQhVpVsE3
ZXwAys/1imearrKxKr0X/ZAtaQvcKO6UxkFZ+wG4f10/ACqRxlYKH9b3lx3PVGcd
iTLTT+ySkzELIt7/yPrT5zIURtGS4qjMmp3rquNnjtT85meB21Tfmq2dOQiBnJny
QQQ8PfK1xc9tQHTCsXrIZW1AnYDHpnUsFjyPgxj/W1kSR1IZohT6koKDNXY0G2Y5
nwIDAQAB
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
            // Empty data should throw an error
            expect(() => verifier.verify('', signature)).toThrow('Data cannot be empty');
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
