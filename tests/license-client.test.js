const LicenseClient = require('../license-client');

describe('LicenseClient', () => {
    let client;
    const testApiKey = 'test_api_key_12345';
    const testPublicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtest
-----END PUBLIC KEY-----`;

    beforeEach(() => {
        client = new LicenseClient({
            apiKey: testApiKey,
            baseUrl: 'https://api.getkeymanager.com',
            verifySignatures: false,
            cacheEnabled: false,
        });
    });

    describe('Constructor', () => {
        test('should throw error when apiKey is missing', () => {
            expect(() => new LicenseClient({})).toThrow();
        });

        test('should accept valid configuration', () => {
            const testClient = new LicenseClient({
                apiKey: 'test_key',
                baseUrl: 'https://test.example.com',
                timeout: 60000,
            });
            expect(testClient).toBeInstanceOf(LicenseClient);
        });

        test('should use default values', () => {
            const testClient = new LicenseClient({
                apiKey: 'test_key',
            });
            expect(testClient.baseUrl).toBe('https://api.getkeymanager.com');
            expect(testClient.timeout).toBe(30000);
            expect(testClient.verifySignatures).toBe(true);
        });
    });

    describe('generateHardwareId', () => {
        test('should generate a valid hardware ID', () => {
            const hardwareId = client.generateHardwareId();
            
            expect(typeof hardwareId).toBe('string');
            expect(hardwareId.length).toBe(32);
        });

        test('should generate consistent hardware ID', () => {
            const hardwareId1 = client.generateHardwareId();
            const hardwareId2 = client.generateHardwareId();
            
            expect(hardwareId1).toBe(hardwareId2);
        });
    });

    describe('validateLicense', () => {
        test('should throw error for empty license key', async () => {
            await expect(client.validateLicense('')).rejects.toThrow();
        });

        test('should throw error for null license key', async () => {
            await expect(client.validateLicense(null)).rejects.toThrow();
        });
    });

    describe('Cache operations', () => {
        test('should clear cache without errors', () => {
            const clientWithCache = new LicenseClient({
                apiKey: testApiKey,
                cacheEnabled: true,
                cacheTtl: 300,
            });

            expect(() => clientWithCache.clearCache()).not.toThrow();
        });

        test('should clear specific license cache', () => {
            const clientWithCache = new LicenseClient({
                apiKey: testApiKey,
                cacheEnabled: true,
            });

            expect(() => clientWithCache.clearLicenseCache('TEST-KEY')).not.toThrow();
        });
    });

    describe('validateOfflineLicense', () => {
        test('should throw error when public key is missing', async () => {
            const offlineLicense = JSON.stringify({
                version: '1.0',
                license: {
                    key: 'TEST-KEY-1234',
                    status: 'active',
                },
                signature: 'test_signature',
            });

            await expect(client.validateOfflineLicense(offlineLicense)).rejects.toThrow();
        });

        test('should handle invalid JSON', async () => {
            const clientWithKey = new LicenseClient({
                apiKey: testApiKey,
                publicKey: testPublicKey,
                verifySignatures: false,
            });

            const result = await clientWithKey.validateOfflineLicense('invalid json');
            
            expect(result.valid).toBe(false);
            expect(result).toHaveProperty('errors');
        });
    });

    describe('UUID generation', () => {
        test('should generate valid UUID v4', () => {
            const uuid1 = client.generateUuid();
            const uuid2 = client.generateUuid();

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
            
            expect(uuid1).toMatch(uuidRegex);
            expect(uuid2).toMatch(uuidRegex);
            expect(uuid1).not.toBe(uuid2);
        });
    });

    describe('activateLicense', () => {
        test('should require hardwareId or domain', async () => {
            await expect(
                client.activateLicense('TEST-KEY', {})
            ).rejects.toThrow();
        });
    });
});
