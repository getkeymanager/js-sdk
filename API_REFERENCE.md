# JavaScript SDK - Complete API Reference (v2.0.0)

## Table of Contents

1. [License Validation & Activation](#license-validation--activation)
2. [License Management](#license-management)
3. [License Assignment](#license-assignment)
4. [License Metadata](#license-metadata)
5. [Product Management](#product-management)
6. [Product Metadata](#product-metadata)
7. [Generators](#generators)
8. [Contracts](#contracts)
9. [Downloadables](#downloadables)
10. [Telemetry](#telemetry)
11. [Changelog](#changelog)
12. [Utility Methods](#utility-methods)

---

## License Validation & Activation

### validateLicense()
Validate a license key online.

```javascript
await client.validateLicense(
    licenseKey: string,
    options?: object
): Promise<object>
```

**Parameters:**
- `licenseKey` (string) - License key to validate
- `options` (object) - Optional: hardwareId, domain, productId

**Returns:** Promise resolving to validation result

**Example:**
```javascript
const result = await client.validateLicense('XXXXX-XXXXX-XXXXX-XXXXX', {
    hardwareId: client.generateHardwareId()
});
```

---

### activateLicense()
Activate a license on a device or domain.

```javascript
await client.activateLicense(
    licenseKey: string,
    options?: object
): Promise<object>
```

**Parameters:**
- `licenseKey` (string) - License key
- `options` (object) - hardwareId OR domain required

**Example:**
```javascript
const result = await client.activateLicense('XXXXX-XXXXX-XXXXX-XXXXX', {
    hardwareId: client.generateHardwareId(),
    metadata: { version: '1.0.0' }
});
```

---

### deactivateLicense()
Deactivate a license from a device or domain.

```javascript
await client.deactivateLicense(
    licenseKey: string,
    options?: object
): Promise<object>
```

---

### checkFeature()
Check if a feature is enabled for a license.

```javascript
await client.checkFeature(
    licenseKey: string,
    featureName: string
): Promise<object>
```

---

### validateOfflineLicense()
Validate an offline license file.

```javascript
await client.validateOfflineLicense(
    offlineLicenseData: string | object,
    options?: object
): Promise<object>
```

**Parameters:**
- `offlineLicenseData` - JSON string or parsed object
- `options` (object) - hardwareId, publicKey

---

## License Management

### createLicenseKeys()
Create multiple license keys.

```javascript
await client.createLicenseKeys(
    productUuid: string,
    generatorUuid: string,
    licenses: array,
    customerEmail?: string,
    options?: object
): Promise<object>
```

**Example:**
```javascript
const result = await client.createLicenseKeys(
    'product-uuid-here',
    'generator-uuid-here',
    [
        { activation_limit: 5, validity_days: 365 },
        { activation_limit: 1, validity_days: 30 }
    ],
    'customer@example.com'
);
```

---

### updateLicenseKey()
Update license key properties.

```javascript
await client.updateLicenseKey(
    licenseKey: string,
    options?: object
): Promise<object>
```

**Options:**
- `status` - New status
- `activation_limit` - New activation limit
- `validity_days` - New validity period

**Example:**
```javascript
const result = await client.updateLicenseKey('XXXXX-XXXXX-XXXXX-XXXXX', {
    activation_limit: 10,
    validity_days: 365
});
```

---

### deleteLicenseKey()
Delete a license key.

```javascript
await client.deleteLicenseKey(licenseKey: string): Promise<object>
```

---

### getLicenseKeys()
Retrieve license keys with filters.

```javascript
await client.getLicenseKeys(filters?: object): Promise<object>
```

**Filters:**
- `product_uuid` - Filter by product
- `status` - Filter by status
- `customer_email` - Filter by customer

**Example:**
```javascript
const result = await client.getLicenseKeys({
    product_uuid: 'product-uuid',
    status: 'active'
});
```

---

### getLicenseDetails()
Get detailed license information.

```javascript
await client.getLicenseDetails(licenseKey: string): Promise<object>
```

---

### getAvailableLicenseKeysCount()
Count available licenses for a product.

```javascript
await client.getAvailableLicenseKeysCount(productUuid: string): Promise<object>
```

---

## License Assignment

### assignLicenseKey()
Assign license to a customer.

```javascript
await client.assignLicenseKey(
    licenseKey: string,
    customerEmail: string,
    customerName?: string
): Promise<object>
```

---

### randomAssignLicenseKeys()
Randomly assign licenses (synchronous).

```javascript
await client.randomAssignLicenseKeys(
    productUuid: string,
    generatorUuid: string,
    quantity: number,
    customerEmail: string,
    customerName?: string,
    options?: object
): Promise<object>
```

**Example:**
```javascript
const result = await client.randomAssignLicenseKeys(
    'product-uuid',
    'generator-uuid',
    5,
    'customer@example.com',
    'John Doe'
);
```

---

### randomAssignLicenseKeysQueued()
Randomly assign licenses (queued/async).

```javascript
await client.randomAssignLicenseKeysQueued(
    productUuid: string,
    generatorUuid: string,
    quantity: number,
    customerEmail: string,
    customerName?: string,
    options?: object
): Promise<object>
```

---

### assignAndActivateLicenseKey()
Assign and activate in one operation.

```javascript
await client.assignAndActivateLicenseKey(
    licenseKey: string,
    customerEmail: string,
    identifier: string,
    options?: object
): Promise<object>
```

---

## License Metadata

### createLicenseKeyMeta()
Create license metadata.

```javascript
await client.createLicenseKeyMeta(
    licenseKey: string,
    metaKey: string,
    metaValue: any
): Promise<object>
```

---

### updateLicenseKeyMeta()
Update license metadata.

```javascript
await client.updateLicenseKeyMeta(
    licenseKey: string,
    metaKey: string,
    metaValue: any
): Promise<object>
```

---

### deleteLicenseKeyMeta()
Delete license metadata.

```javascript
await client.deleteLicenseKeyMeta(
    licenseKey: string,
    metaKey: string
): Promise<object>
```

---

## Product Management

### createProduct()
Create a new product.

```javascript
await client.createProduct(
    name: string,
    options?: object
): Promise<object>
```

**Options:**
- `slug` - Product slug
- `description` - Product description
- `status` - Product status

---

### updateProduct()
Update product details.

```javascript
await client.updateProduct(
    productUuid: string,
    options?: object
): Promise<object>
```

---

### deleteProduct()
Delete a product.

```javascript
await client.deleteProduct(productUuid: string): Promise<object>
```

---

### getAllProducts()
List all products.

```javascript
await client.getAllProducts(): Promise<object>
```

---

## Product Metadata

### createProductMeta()
Create product metadata.

```javascript
await client.createProductMeta(
    productUuid: string,
    metaKey: string,
    metaValue: any
): Promise<object>
```

---

### updateProductMeta()
Update product metadata.

```javascript
await client.updateProductMeta(
    productUuid: string,
    metaKey: string,
    metaValue: any
): Promise<object>
```

---

### deleteProductMeta()
Delete product metadata.

```javascript
await client.deleteProductMeta(
    productUuid: string,
    metaKey: string
): Promise<object>
```

---

## Generators

### getAllGenerators()
List all generators.

```javascript
await client.getAllGenerators(productUuid?: string): Promise<object>
```

---

### generateLicenseKeys()
Generate new license keys.

```javascript
await client.generateLicenseKeys(
    generatorUuid: string,
    quantity: number,
    options?: object
): Promise<object>
```

**Options:**
- `activation_limit` - Activation limit
- `validity_days` - Validity period
- `idempotencyKey` - Custom idempotency key

---

## Contracts

### getAllContracts()
List all contracts.

```javascript
await client.getAllContracts(): Promise<object>
```

---

### createContract()
Create a new contract.

```javascript
await client.createContract(
    contractData: object,
    options?: object
): Promise<object>
```

**Required fields in contractData:**
- `contract_key`
- `contract_name`
- `contract_information`
- `product_id`
- `license_keys_quantity`
- `status`
- `can_get_info`
- `can_generate`
- `can_destroy`
- `can_destroy_all`

---

### updateContract()
Update contract details.

```javascript
await client.updateContract(
    contractId: number,
    contractData: object
): Promise<object>
```

---

### deleteContract()
Delete a contract.

```javascript
await client.deleteContract(contractId: number): Promise<object>
```

---

## Downloadables

### accessDownloadables()
Access downloadable files for a license.

```javascript
await client.accessDownloadables(
    licenseKey: string,
    identifier: string
): Promise<object>
```

**Returns:** Promise resolving to downloadable files with signed URLs

---

## Telemetry

### sendTelemetry()
Send telemetry data.

```javascript
await client.sendTelemetry(
    licenseKey: string,
    eventType: string,
    payload?: object,
    metadata?: object
): Promise<object>
```

---

### getTelemetryData()
Retrieve telemetry data with filters.

```javascript
await client.getTelemetryData(
    dataType: string,
    dataGroup: string,
    filters?: object
): Promise<object>
```

**Data Types:**
- `numeric-single-value`
- `numeric-xy-axis`
- `text`

**Filters:**
- `product_id`
- `user_identifier`
- `license_key`
- `has_red_flags`

---

## Changelog

### getProductChangelog()
Get product changelog (public, no auth required).

```javascript
await client.getProductChangelog(slug: string): Promise<object>
```

---

## Utility Methods

### generateHardwareId()
Generate hardware ID for current system.

```javascript
client.generateHardwareId(): string
```

---

### clearCache()
Clear all cache.

```javascript
client.clearCache(): void
```

---

### clearLicenseCache()
Clear cache for specific license.

```javascript
client.clearLicenseCache(licenseKey: string): void
```

---

## Error Handling

All async methods can throw the following errors:

- `LicenseError` - Base error
- `ValidationError` - Validation errors
- `NetworkError` - Network errors
- `SignatureError` - Signature verification errors
- `RateLimitError` - Rate limit exceeded
- `ExpiredError` - License expired
- `SuspendedError` - License suspended
- `RevokedError` - License revoked

**Example:**
```javascript
const { ValidationError, LicenseError } = require('@getkeymanager/js-sdk');

try {
    const result = await client.validateLicense('XXXXX-XXXXX-XXXXX-XXXXX');
} catch (error) {
    if (error instanceof ValidationError) {
        // Handle validation error
    } else if (error instanceof LicenseError) {
        // Handle general license error
    }
}
```

---

## TypeScript Support

The SDK includes TypeScript type definitions. Import with:

```typescript
import LicenseClient from '@getkeymanager/js-sdk';

const client = new LicenseClient({
    apiKey: 'your-api-key'
});
```
