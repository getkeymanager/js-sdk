# License Management Platform - JavaScript SDK

Official JavaScript/Node.js SDK for the License Management Platform API.

**Version: 2.0.0** - Now with complete API coverage!

## Features

### Core Features (v1.x)
- ✅ License validation (online and offline)
- ✅ License activation and deactivation
- ✅ Feature flag checking
- ✅ Hardware ID generation
- ✅ Telemetry submission
- ✅ RSA-4096-SHA256 signature verification
- ✅ Automatic retry with exponential backoff
- ✅ Built-in caching
- ✅ Idempotent operations
- ✅ ES6+ modern syntax
- ✅ Promise-based API
- ✅ TypeScript support (types included)

### New in v2.0.0
- ✅ **Complete license management** - Create, update, delete, list licenses
- ✅ **License assignment** - Assign licenses to customers (sync & async)
- ✅ **Metadata management** - Custom metadata for licenses and products
- ✅ **Product management** - Create and manage products via API
- ✅ **Generator support** - Generate licenses programmatically
- ✅ **Contract management** - Manage API contracts
- ✅ **Downloadables access** - Provide downloadable files to users
- ✅ **Advanced telemetry** - Retrieve telemetry data with filters
- ✅ **Public changelog API** - Access changelogs without authentication

**30+ new methods added while maintaining full backward compatibility!**

## Requirements

- Node.js 14.0 or higher
- npm or yarn

## Installation

### Via npm

```bash
npm install @getkeymanager/js-sdk
```

### Via yarn

```bash
yarn add @getkeymanager/js-sdk
```

## Quick Start

### Initialize the Client

```javascript
const LicenseClient = require('@getkeymanager/js-sdk');
const fs = require('fs');

const client = new LicenseClient({
    apiKey: 'your-api-key-here',
    publicKey: fs.readFileSync('/path/to/public-key.pem', 'utf8'),
    baseUrl: 'https://api.getkeymanager.com', // Optional
    verifySignatures: true, // Optional, default: true
    cacheEnabled: true, // Optional, default: true
    cacheTtl: 300, // Optional, default: 300 seconds
});
```

### Validate a License (Online)

```javascript
try {
    const result = await client.validateLicense('XXXXX-XXXXX-XXXXX-XXXXX');
    
    if (result.valid) {
        console.log('License is valid!');
        console.log('Status:', result.license.status);
        console.log('Expires:', result.license.expires_at || 'Never');
    } else {
        console.log('License is invalid');
    }
} catch (error) {
    console.error('Error:', error.message);
}
```

### Activate a License

```javascript
try {
    const hardwareId = client.generateHardwareId();
    
    const result = await client.activateLicense('XXXXX-XXXXX-XXXXX-XXXXX', {
        hardwareId,
        metadata: {
            hostname: require('os').hostname(),
            application_version: '1.0.0'
        }
    });
    
    if (result.success) {
        console.log('License activated successfully!');
        console.log('Activation ID:', result.activation.id);
    }
} catch (error) {
    console.error('Activation failed:', error.message);
}
```

### Deactivate a License

```javascript
try {
    const result = await client.deactivateLicense('XXXXX-XXXXX-XXXXX-XXXXX', {
        hardwareId
    });
    
    if (result.success) {
        console.log('License deactivated successfully!');
    }
} catch (error) {
    console.error('Deactivation failed:', error.message);
}
```

### Check Feature Flags

```javascript
try {
    const result = await client.checkFeature('XXXXX-XXXXX-XXXXX-XXXXX', 'premium_feature');
    
    if (result.enabled) {
        console.log('Feature is enabled!');
        if (result.value) {
            console.log('Feature value:', result.value);
        }
    } else {
        console.log('Feature is not enabled');
    }
} catch (error) {
    console.error('Error:', error.message);
}
```

### Validate Offline License

```javascript
const fs = require('fs');

const offlineLicense = fs.readFileSync('/path/to/offline-license.json', 'utf8');

try {
    const result = await client.validateOfflineLicense(offlineLicense, {
        hardwareId: client.generateHardwareId()
    });
    
    if (result.valid) {
        console.log('Offline license is valid!');
        console.log(result.license);
    } else {
        console.log('Offline license validation failed:');
        result.errors.forEach(error => console.log(`  - ${error}`));
    }
} catch (error) {
    console.error('Error:', error.message);
}
```

### Send Telemetry

```javascript
const result = await client.sendTelemetry(
    'XXXXX-XXXXX-XXXXX-XXXXX',
    'application.started',
    {
        version: '1.0.0',
        platform: process.platform
    },
    {
        custom_field: 'custom_value'
    }
);

if (result.success) {
    console.log('Telemetry sent successfully');
}
```

### Generate Hardware ID

```javascript
const hardwareId = client.generateHardwareId();
console.log('Hardware ID:', hardwareId);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | *required* | Your API key |
| `publicKey` | string | null | RSA public key for signature verification |
| `baseUrl` | string | `https://api.getkeymanager.com` | API base URL |
| `timeout` | number | 30000 | Request timeout in milliseconds |
| `verifySignatures` | boolean | true | Verify response signatures |
| `environment` | string | null | Environment (production/staging/development) |
| `cacheEnabled` | boolean | true | Enable response caching |
| `cacheTtl` | number | 300 | Cache TTL in seconds |
| `retryAttempts` | number | 3 | Number of retry attempts |
| `retryDelay` | number | 1000 | Retry delay in milliseconds |

## Error Handling

The SDK uses a hierarchy of exceptions:

```
LicenseError (base)
├── ValidationError
├── NetworkError
├── SignatureError
├── RateLimitError
├── ExpiredError
├── SuspendedError
└── RevokedError
```

### Example Error Handling

```javascript
const {
    LicenseClient,
    ExpiredError,
    RateLimitError,
    NetworkError
} = require('@getkeymanager/js-sdk');

try {
    const result = await client.validateLicense(licenseKey);
} catch (error) {
    if (error instanceof ExpiredError) {
        console.error('License has expired:', error.message);
    } else if (error instanceof RateLimitError) {
        console.error('Rate limit exceeded. Please try again later.');
    } else if (error instanceof NetworkError) {
        console.error('Network error:', error.message);
    } else {
        console.error('License error:', error.message);
    }
}
```

## Caching

The SDK automatically caches:
- License validation responses
- Feature flag checks

### Clear Cache

```javascript
// Clear all cache
client.clearCache();

// Clear cache for specific license
client.clearLicenseCache('XXXXX-XXXXX-XXXXX-XXXXX');
```

## Signature Verification

All API responses are cryptographically signed. The SDK automatically verifies signatures when `verifySignatures` is enabled.

### Using SignatureVerifier Directly

```javascript
const SignatureVerifier = require('@getkeymanager/js-sdk/signature-verifier');
const fs = require('fs');

const publicKey = fs.readFileSync('/path/to/public-key.pem', 'utf8');
const verifier = new SignatureVerifier(publicKey);

const data = '{"license":"XXXXX-XXXXX-XXXXX-XXXXX"}';
const signature = 'base64_encoded_signature';

if (verifier.verify(data, signature)) {
    console.log('Signature is valid!');
} else {
    console.log('Signature verification failed!');
}
```

### Verify JSON Response

```javascript
const jsonResponse = '{"data":{},"signature":"..."}';

if (verifier.verifyJsonResponse(jsonResponse)) {
    console.log('Response signature is valid!');
}
```

## Idempotency

Activation and deactivation operations support idempotency:

```javascript
const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';

const result = await client.activateLicense(licenseKey, {
    hardwareId,
    idempotencyKey
});

// Repeat with same key will return same response
const result2 = await client.activateLicense(licenseKey, {
    hardwareId,
    idempotencyKey
});
```

## TypeScript Support

The SDK includes TypeScript type definitions:

```typescript
import LicenseClient from '@getkeymanager/js-sdk';

const client = new LicenseClient({
    apiKey: 'your-api-key',
    publicKey: publicKey
});

const result = await client.validateLicense('XXXXX-XXXXX-XXXXX-XXXXX');
```

## Best Practices

### 1. Store API Key Securely

```javascript
// ❌ Don't hardcode API keys
const client = new LicenseClient({ apiKey: 'pk_live_...' });

// ✅ Use environment variables
const client = new LicenseClient({ apiKey: process.env.LICENSE_API_KEY });
```

### 2. Cache Hardware ID

```javascript
const fs = require('fs');

// Generate once and store
const hardwareId = client.generateHardwareId();
fs.writeFileSync('/var/app/hwid.txt', hardwareId);

// Reuse stored value
const hardwareId = fs.readFileSync('/var/app/hwid.txt', 'utf8');
```

### 3. Handle Network Failures Gracefully

```javascript
try {
    const result = await client.validateLicense(licenseKey);
} catch (error) {
    if (error instanceof NetworkError) {
        // Fall back to offline validation
        const offlineLicense = fs.readFileSync('/var/app/offline-license.json', 'utf8');
        const result = await client.validateOfflineLicense(offlineLicense);
    }
}
```

### 4. Validate Licenses Periodically

```javascript
const fs = require('fs');

// Check license every 24 hours
const lastCheck = parseInt(fs.readFileSync('/var/app/last-check.txt', 'utf8'));
if (Date.now() - lastCheck > 86400000) {
    const result = await client.validateLicense(licenseKey);
    fs.writeFileSync('/var/app/last-check.txt', Date.now().toString());
}
```

## Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Examples

See the `/examples` directory for complete working examples:

- `validate.js` - Basic license validation
- `activate.js` - License activation
- `features.js` - Feature flag checking
- `offline.js` - Offline license validation
- `telemetry.js` - Sending telemetry data

## Support

- Documentation: https://docs.getkeymanager.com
- API Reference: https://api.getkeymanager.com/docs
- Issues: https://github.com/getkeymanager/js-sdk/issues
- Email: support@getkeymanager.com

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## Changelog

See CHANGELOG.md for version history.
