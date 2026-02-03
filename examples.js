/**
 * License Management Platform - JavaScript SDK Examples (v2.0.0)
 * 
 * This file demonstrates all available SDK methods.
 */

const LicenseClient = require('./license-client');
const fs = require('fs');
const os = require('os');

// Initialize client
const client = new LicenseClient({
    apiKey: 'your-api-key-here',
    publicKey: fs.readFileSync('/path/to/public-key.pem', 'utf8'),
    baseUrl: 'https://api.getkeymanager.com',
    verifySignatures: true,
    cacheEnabled: true,
});

async function runExamples() {
    // =============================================================================
    // LICENSE VALIDATION & ACTIVATION
    // =============================================================================

    console.log('=== License Validation & Activation ===\n');

    // Validate license
    try {
        const result = await client.validateLicense('XXXXX-XXXXX-XXXXX-XXXXX');
        console.log('Valid:', result.valid ? 'Yes' : 'No');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Activate license
    try {
        const hardwareId = client.generateHardwareId();
        const result = await client.activateLicense('XXXXX-XXXXX-XXXXX-XXXXX', {
            hardwareId
        });
        console.log('Activation ID:', result.activation.id);
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Deactivate license
    try {
        const hardwareId = client.generateHardwareId();
        const result = await client.deactivateLicense('XXXXX-XXXXX-XXXXX-XXXXX', {
            hardwareId
        });
        console.log('Deactivated:', result.success ? 'Yes' : 'No');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Check feature
    try {
        const result = await client.checkFeature('XXXXX-XXXXX-XXXXX-XXXXX', 'premium_support');
        console.log('Feature enabled:', result.enabled ? 'Yes' : 'No');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Validate offline license
    try {
        const offlineLicense = fs.readFileSync('/path/to/offline-license.json', 'utf8');
        const hardwareId = client.generateHardwareId();
        const result = await client.validateOfflineLicense(offlineLicense, {
            hardwareId
        });
        console.log('Offline valid:', result.valid ? 'Yes' : 'No');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // LICENSE MANAGEMENT (NEW IN V2)
    // =============================================================================

    console.log('\n=== License Management ===\n');

    // Create license keys
    try {
        const result = await client.createLicenseKeys(
            'product-uuid',
            'generator-uuid',
            [
                { activation_limit: 5, validity_days: 365 },
                { activation_limit: 1, validity_days: 30 }
            ],
            'customer@example.com'
        );
        console.log('Created', result.licenses.length, 'licenses');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Update license key
    try {
        const result = await client.updateLicenseKey('XXXXX-XXXXX-XXXXX-XXXXX', {
            activation_limit: 10,
            validity_days: 365
        });
        console.log('Updated license');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Get license keys with filters
    try {
        const result = await client.getLicenseKeys({
            product_uuid: 'product-uuid',
            status: 'active'
        });
        console.log('Found', result.licenses.length, 'licenses');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Get license details
    try {
        const result = await client.getLicenseDetails('XXXXX-XXXXX-XXXXX-XXXXX');
        console.log('License status:', result.license.status);
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Get available license count
    try {
        const result = await client.getAvailableLicenseKeysCount('product-uuid');
        console.log('Available licenses:', result.count);
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Delete license key
    try {
        const result = await client.deleteLicenseKey('XXXXX-XXXXX-XXXXX-XXXXX');
        console.log('Deleted license');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // LICENSE ASSIGNMENT (NEW IN V2)
    // =============================================================================

    console.log('\n=== License Assignment ===\n');

    // Assign license to customer
    try {
        const result = await client.assignLicenseKey(
            'XXXXX-XXXXX-XXXXX-XXXXX',
            'customer@example.com',
            'John Doe'
        );
        console.log('Assigned license');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Random assign licenses (synchronous)
    try {
        const result = await client.randomAssignLicenseKeys(
            'product-uuid',
            'generator-uuid',
            5,
            'customer@example.com',
            'John Doe'
        );
        console.log('Assigned', result.licenses.length, 'licenses');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Random assign licenses (queued)
    try {
        const result = await client.randomAssignLicenseKeysQueued(
            'product-uuid',
            'generator-uuid',
            100,
            'customer@example.com',
            'John Doe'
        );
        console.log('Job queued:', result.job_id);
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Assign and activate
    try {
        const hardwareId = client.generateHardwareId();
        const result = await client.assignAndActivateLicenseKey(
            'XXXXX-XXXXX-XXXXX-XXXXX',
            'customer@example.com',
            hardwareId
        );
        console.log('Assigned and activated');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // LICENSE METADATA (NEW IN V2)
    // =============================================================================

    console.log('\n=== License Metadata ===\n');

    // Create metadata
    try {
        const result = await client.createLicenseKeyMeta(
            'XXXXX-XXXXX-XXXXX-XXXXX',
            'custom_field',
            'custom_value'
        );
        console.log('Created metadata');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Update metadata
    try {
        const result = await client.updateLicenseKeyMeta(
            'XXXXX-XXXXX-XXXXX-XXXXX',
            'custom_field',
            'new_value'
        );
        console.log('Updated metadata');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Delete metadata
    try {
        const result = await client.deleteLicenseKeyMeta(
            'XXXXX-XXXXX-XXXXX-XXXXX',
            'custom_field'
        );
        console.log('Deleted metadata');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // PRODUCT MANAGEMENT (NEW IN V2)
    // =============================================================================

    console.log('\n=== Product Management ===\n');

    // Create product
    try {
        const result = await client.createProduct('My Product', {
            slug: 'my-product',
            description: 'Product description',
            status: 'active'
        });
        console.log('Created product:', result.product.uuid);
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Update product
    try {
        const result = await client.updateProduct('product-uuid', {
            name: 'Updated Product Name',
            description: 'Updated description'
        });
        console.log('Updated product');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Get all products
    try {
        const result = await client.getAllProducts();
        console.log('Found', result.products.length, 'products');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Delete product
    try {
        const result = await client.deleteProduct('product-uuid');
        console.log('Deleted product');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // PRODUCT METADATA (NEW IN V2)
    // =============================================================================

    console.log('\n=== Product Metadata ===\n');

    // Create product metadata
    try {
        const result = await client.createProductMeta('product-uuid', 'version', '1.0.0');
        console.log('Created product metadata');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Update product metadata
    try {
        const result = await client.updateProductMeta('product-uuid', 'version', '2.0.0');
        console.log('Updated product metadata');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Delete product metadata
    try {
        const result = await client.deleteProductMeta('product-uuid', 'version');
        console.log('Deleted product metadata');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // GENERATORS (NEW IN V2)
    // =============================================================================

    console.log('\n=== Generators ===\n');

    // Get all generators
    try {
        const result = await client.getAllGenerators();
        console.log('Found', result.generators.length, 'generators');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Generate license keys
    try {
        const result = await client.generateLicenseKeys('generator-uuid', 10, {
            activation_limit: 5,
            validity_days: 365
        });
        console.log('Generated', result.licenses.length, 'licenses');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // CONTRACTS (NEW IN V2)
    // =============================================================================

    console.log('\n=== Contracts ===\n');

    // Get all contracts
    try {
        const result = await client.getAllContracts();
        console.log('Found', result.contracts.length, 'contracts');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Create contract
    try {
        const result = await client.createContract({
            contract_key: 'unique-contract-key',
            contract_name: 'API Contract',
            contract_information: 'Contract details',
            product_id: 1,
            license_keys_quantity: 1000,
            status: 'active',
            can_get_info: true,
            can_generate: true,
            can_destroy: false,
            can_destroy_all: false
        });
        console.log('Created contract');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // DOWNLOADABLES (NEW IN V2)
    // =============================================================================

    console.log('\n=== Downloadables ===\n');

    // Access downloadables
    try {
        const hardwareId = client.generateHardwareId();
        const result = await client.accessDownloadables('XXXXX-XXXXX-XXXXX-XXXXX', hardwareId);
        console.log('Found', result.downloadables.length, 'files');
        result.downloadables.forEach(file => {
            console.log('-', file.filename + ':', file.download_url);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // TELEMETRY (EXPANDED IN V2)
    // =============================================================================

    console.log('\n=== Telemetry ===\n');

    // Send telemetry
    try {
        const result = await client.sendTelemetry(
            'XXXXX-XXXXX-XXXXX-XXXXX',
            'application.started',
            { version: '1.0.0' },
            { hostname: os.hostname() }
        );
        console.log('Telemetry sent');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Get telemetry data
    try {
        const result = await client.getTelemetryData(
            'numeric-single-value',
            'app_usage',
            { product_id: 1 }
        );
        console.log('Retrieved telemetry data');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // CHANGELOG (NEW IN V2)
    // =============================================================================

    console.log('\n=== Changelog ===\n');

    // Get product changelog
    try {
        const result = await client.getProductChangelog('my-product');
        console.log('Found', result.entries.length, 'changelog entries');
    } catch (error) {
        console.error('Error:', error.message);
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    console.log('\n=== Utility Methods ===\n');

    // Generate hardware ID
    const hardwareId = client.generateHardwareId();
    console.log('Hardware ID:', hardwareId);

    // Clear cache
    client.clearCache();
    console.log('Cache cleared');

    // Clear license-specific cache
    client.clearLicenseCache('XXXXX-XXXXX-XXXXX-XXXXX');
    console.log('License cache cleared');

    console.log('\n=== Examples Complete ===');
}

// Run examples
runExamples().catch(console.error);
