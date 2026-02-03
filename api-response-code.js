/**
 * API Response Code Constants
 * 
 * This module mirrors the server-side ApiResponseCode enum and provides
 * a centralized reference for all API response codes used throughout the SDK.
 * 
 * @module ApiResponseCode
 */

/**
 * API Response Codes
 * All codes are organized by functional area
 */
const ApiResponseCode = {
    // API Key Related [100-149]
    INVALID_API_KEY: 100,
    INACTIVE_API_KEY: 101,
    INSUFFICIENT_PERMISSIONS: 102,
    IP_NOT_ALLOWED: 103,

    // Access Restrictions [150-199]
    ACCESS_DENIED: 150,

    // Verify [200-219]
    VALID_LICENSE_KEY: 200,
    LICENSE_NOT_ASSIGNED: 201,
    NO_ACTIVATION_FOUND: 202,
    PRODUCT_INACTIVE: 203,
    LICENSE_BLOCKED: 204,
    LICENSE_EXPIRED: 205,
    ENVATO_PURCHASE_CODE_ADDED: 206,
    INVALID_LICENSE_KEY: 210,
    IDENTIFIER_REQUIRED: 215,

    // Deactivate [400-449]
    LICENSE_DEACTIVATED: 400,
    LICENSE_ALREADY_INACTIVE: 401,

    // Activate [300-349]
    LICENSE_ACTIVATED: 300,
    LICENSE_ALREADY_ACTIVE: 301,
    ACTIVATION_LIMIT_REACHED: 302,

    // Update License Key Meta [350-399]
    META_KEY_REQUIRED_UPDATE: 350,
    META_VALUE_REQUIRED_UPDATE: 351,
    META_KEY_NOT_EXISTS_UPDATE: 352,
    METADATA_UPDATED: 353,

    // Get License Key Details [500-549]
    ACTIVE_LICENSE_FOUND: 500,

    // Delete Product [550-599]
    PRODUCT_DELETED: 550,
    PRODUCT_NOT_FOUND: 551,

    // Access Downloadables [600-649]
    DOWNLOADS: 600,

    // Update Product [650-699]
    PRODUCT_UPDATED: 650,
    INCORRECT_DATA_PRODUCT_UPDATE: 651,

    // Download [700-749]
    FILE_NOT_EXISTS: 700,
    NO_PERMISSION_FILE: 701,

    // Get License Keys [730-739]
    LICENSE_KEYS_LIST: 730,

    // Get Available License Keys Count [740-749]
    PRODUCT_NOT_EXISTS_COUNT: 740,
    AVAILABLE_LICENSE_KEYS_COUNT: 741,

    // Create Product [750-799]
    PRODUCT_CREATED: 750,
    INCORRECT_DATA_PRODUCT_CREATE: 751,

    // Assign License Key [800-809]
    LICENSE_KEY_ASSIGNED: 800,
    INVALID_OR_ALREADY_ASSIGNED: 801,

    // Random Assign License Keys [802-809]
    INSUFFICIENT_LICENSE_KEYS: 802,
    LICENSE_KEYS_ASSIGNED: 803,
    PRODUCT_NOT_FOUND_ASSIGN: 805,
    GENERATOR_NOT_FOUND_ASSIGN: 806,
    REQUEST_QUEUED: 807,

    // Get All Products [810-819]
    ALL_PRODUCTS: 810,

    // Generate [815-819]
    GENERATED_LICENSE_KEYS: 815,

    // Get All Generators [820-824]
    ALL_GENERATORS: 820,

    // Create Contract [825-829]
    INCORRECT_DATA_CONTRACT: 825,

    // Send Telemetry [830-839]
    CORRECT_FORMAT_TELEMETRY_SAVED: 830,
    INCORRECT_FORMAT_TELEMETRY_SAVED: 831,

    // Contract CRUD [841-846]
    CONTRACT_CREATED: 841,
    CONTRACT_UPDATED: 842,
    CONTRACT_DELETED: 843,
    CONTRACT_NOT_FOUND: 844,
    ALL_CONTRACTS: 846,

    // Delete License Key [850-859]
    LICENSE_KEY_DELETED: 850,
    LICENSE_KEY_NOT_FOUND: 851,

    // Create License Keys [900-909]
    LICENSE_KEYS_CREATION_RESULT: 900,
    INCORRECT_DATA_LICENSE_CREATE: 901,
    NO_LICENSE_KEYS_CREATED: 902,

    // Update License Key [950-959]
    LICENSE_KEY_UPDATED: 950,
    INCORRECT_DATA_LICENSE_UPDATE: 951,
    LICENSE_KEY_NOT_FOUND_UPDATE: 952,

    // Get Telemetry [970-979]
    TELEMETRY_DATA_FOUND: 970,

    // Create License Key Meta [450-459]
    META_KEY_REQUIRED_CREATE: 450,
    META_VALUE_REQUIRED_CREATE: 451,
    META_KEY_ALREADY_EXISTS_CREATE: 452,
    METADATA_CREATED: 453,

    // Delete License Key Meta [250-259]
    META_KEY_REQUIRED_DELETE: 250,
    META_KEY_NOT_EXISTS_DELETE: 251,
    METADATA_DELETED: 252,

    // Create Product Meta [270-279]
    PRODUCT_META_KEY_REQUIRED_CREATE: 270,
    PRODUCT_META_VALUE_REQUIRED_CREATE: 271,
    PRODUCT_META_KEY_ALREADY_EXISTS: 272,
    PRODUCT_META_CREATED: 273,
    PRODUCT_NOT_FOUND_META_CREATE: 274,

    // Update Product Meta [370-379]
    PRODUCT_META_KEY_REQUIRED_UPDATE: 370,
    PRODUCT_META_VALUE_REQUIRED_UPDATE: 371,
    PRODUCT_META_KEY_NOT_EXISTS_UPDATE: 372,
    PRODUCT_META_UPDATED: 373,
    PRODUCT_NOT_FOUND_META_UPDATE: 374,

    // Delete Product Meta [480-489]
    PRODUCT_META_KEY_REQUIRED_DELETE: 480,
    PRODUCT_META_KEY_NOT_EXISTS_DELETE: 481,
    PRODUCT_META_DELETED: 482,
    PRODUCT_NOT_FOUND_META_DELETE: 483,

    // Contract API [1200-1599]
    CONTRACT_NOT_FOUND_INFO: 1200,
    CONTRACT_PRODUCT_NOT_FOUND: 1202,
    CONTRACT_GENERATOR_NOT_FOUND: 1203,
    CONTRACT_FOUND: 1204,
    LICENSE_KEYS_LIMIT_REACHED: 1205,
    CANNOT_GENERATE_QUANTITY: 1206,
    CONTRACT_LICENSE_KEYS_GENERATED: 1300,
    CONTRACT_LICENSE_KEY_DELETED: 1400,
    CONTRACT_LICENSE_KEY_NOT_FOUND: 1401,
    CONTRACT_LICENSE_KEYS_DELETED: 1500,
    CONTRACT_NO_LICENSE_KEYS_FOUND: 1501,

    // Changelog API [1600-1649]
    CHANGELOG_RETRIEVED: 1600,
    CHANGELOG_DISABLED_GLOBALLY: 1601,
    CHANGELOG_DISABLED_FOR_PRODUCT: 1602,

    // Product Information API [630-649]
    PRODUCT_FOUND: 631,
    PRODUCT_PUBLIC_KEY_FOUND: 632,
    PRODUCT_PUBLIC_KEY_NOT_FOUND: 633,
};

/**
 * Reverse lookup map: code -> name
 */
const CODE_NAMES = {};
for (const [name, code] of Object.entries(ApiResponseCode)) {
    CODE_NAMES[code] = name;
}

/**
 * Human-readable messages for each response code
 */
const CODE_MESSAGES = {
    [ApiResponseCode.INVALID_API_KEY]: 'Invalid API Key',
    [ApiResponseCode.INACTIVE_API_KEY]: 'Inactive API Key',
    [ApiResponseCode.INSUFFICIENT_PERMISSIONS]: "The used API key doesn't have the required capability to access this endpoint",
    [ApiResponseCode.IP_NOT_ALLOWED]: "API key can't be used from this IP address",
    [ApiResponseCode.ACCESS_DENIED]: 'Access denied',
    [ApiResponseCode.VALID_LICENSE_KEY]: 'Valid license key',
    [ApiResponseCode.LICENSE_NOT_ASSIGNED]: 'This license key is not assigned',
    [ApiResponseCode.NO_ACTIVATION_FOUND]: 'No activation found for this license key/identifier combination',
    [ApiResponseCode.PRODUCT_INACTIVE]: "The product associated with this license key is not active or doesn't exist",
    [ApiResponseCode.LICENSE_BLOCKED]: 'License key blocked',
    [ApiResponseCode.LICENSE_EXPIRED]: 'License key expired',
    [ApiResponseCode.ENVATO_PURCHASE_CODE_ADDED]: 'Envato purchase code added',
    [ApiResponseCode.INVALID_LICENSE_KEY]: 'Invalid license key',
    [ApiResponseCode.IDENTIFIER_REQUIRED]: 'Identifier is required',
    [ApiResponseCode.LICENSE_ACTIVATED]: 'License key activated',
    [ApiResponseCode.LICENSE_ALREADY_ACTIVE]: 'License key already active',
    [ApiResponseCode.ACTIVATION_LIMIT_REACHED]: 'License key reached activation limit',
    [ApiResponseCode.LICENSE_DEACTIVATED]: 'License key deactivated',
    [ApiResponseCode.LICENSE_ALREADY_INACTIVE]: 'License key already inactive',
    [ApiResponseCode.ACTIVE_LICENSE_FOUND]: 'Active license key found',
    [ApiResponseCode.DOWNLOADS]: 'Downloads',
    [ApiResponseCode.FILE_NOT_EXISTS]: "The request file doesn't exist",
    [ApiResponseCode.NO_PERMISSION_FILE]: "You don't have permission to access it",
    [ApiResponseCode.LICENSE_KEY_ASSIGNED]: 'License key assigned',
    [ApiResponseCode.INVALID_OR_ALREADY_ASSIGNED]: 'Invalid or already assigned license key',
    [ApiResponseCode.INSUFFICIENT_LICENSE_KEYS]: 'Insufficient license keys',
    [ApiResponseCode.LICENSE_KEYS_ASSIGNED]: 'License keys assigned',
    [ApiResponseCode.PRODUCT_NOT_FOUND_ASSIGN]: 'Product not found',
    [ApiResponseCode.GENERATOR_NOT_FOUND_ASSIGN]: 'Generator not found',
    [ApiResponseCode.REQUEST_QUEUED]: 'Request Queued',
    [ApiResponseCode.LICENSE_KEYS_CREATION_RESULT]: 'License keys creation result',
    [ApiResponseCode.INCORRECT_DATA_LICENSE_CREATE]: 'Incorrect data found',
    [ApiResponseCode.NO_LICENSE_KEYS_CREATED]: 'No license keys created',
    [ApiResponseCode.LICENSE_KEY_UPDATED]: 'License keys updated',
    [ApiResponseCode.INCORRECT_DATA_LICENSE_UPDATE]: 'Incorrect data found',
    [ApiResponseCode.LICENSE_KEY_NOT_FOUND_UPDATE]: 'License key not found',
    [ApiResponseCode.LICENSE_KEY_DELETED]: 'License key deleted',
    [ApiResponseCode.LICENSE_KEY_NOT_FOUND]: 'License key not found',
    [ApiResponseCode.PRODUCT_CREATED]: 'Product created',
    [ApiResponseCode.INCORRECT_DATA_PRODUCT_CREATE]: 'Incorrect data found',
    [ApiResponseCode.PRODUCT_UPDATED]: 'Product updated',
    [ApiResponseCode.INCORRECT_DATA_PRODUCT_UPDATE]: 'Incorrect data found',
    [ApiResponseCode.PRODUCT_DELETED]: 'Product deleted',
    [ApiResponseCode.PRODUCT_NOT_FOUND]: 'Product not found',
    [ApiResponseCode.META_KEY_REQUIRED_CREATE]: 'Meta key is required',
    [ApiResponseCode.META_VALUE_REQUIRED_CREATE]: 'Meta value is required',
    [ApiResponseCode.META_KEY_ALREADY_EXISTS_CREATE]: 'Meta key already exists',
    [ApiResponseCode.METADATA_CREATED]: 'Metadata created',
    [ApiResponseCode.META_KEY_REQUIRED_UPDATE]: 'Meta key is required',
    [ApiResponseCode.META_VALUE_REQUIRED_UPDATE]: 'Meta value is required',
    [ApiResponseCode.META_KEY_NOT_EXISTS_UPDATE]: "Meta key doesn't exist",
    [ApiResponseCode.METADATA_UPDATED]: 'Metadata updated',
    [ApiResponseCode.META_KEY_REQUIRED_DELETE]: 'Meta key is required',
    [ApiResponseCode.META_KEY_NOT_EXISTS_DELETE]: "Meta key doesn't exist",
    [ApiResponseCode.METADATA_DELETED]: 'Metadata deleted',
    [ApiResponseCode.PRODUCT_META_KEY_REQUIRED_CREATE]: 'Meta key is required',
    [ApiResponseCode.PRODUCT_META_VALUE_REQUIRED_CREATE]: 'Meta value is required',
    [ApiResponseCode.PRODUCT_META_KEY_ALREADY_EXISTS]: 'Meta key already exists',
    [ApiResponseCode.PRODUCT_META_CREATED]: 'Product meta created',
    [ApiResponseCode.PRODUCT_NOT_FOUND_META_CREATE]: 'Product not found',
    [ApiResponseCode.PRODUCT_META_KEY_REQUIRED_UPDATE]: 'Meta key is required',
    [ApiResponseCode.PRODUCT_META_VALUE_REQUIRED_UPDATE]: 'Meta value is required',
    [ApiResponseCode.PRODUCT_META_KEY_NOT_EXISTS_UPDATE]: "Meta key doesn't exist",
    [ApiResponseCode.PRODUCT_META_UPDATED]: 'Product meta updated',
    [ApiResponseCode.PRODUCT_NOT_FOUND_META_UPDATE]: 'Product not found',
    [ApiResponseCode.PRODUCT_META_KEY_REQUIRED_DELETE]: 'Meta key is required',
    [ApiResponseCode.PRODUCT_META_KEY_NOT_EXISTS_DELETE]: "Meta key doesn't exist",
    [ApiResponseCode.PRODUCT_META_DELETED]: 'Product meta deleted',
    [ApiResponseCode.PRODUCT_NOT_FOUND_META_DELETE]: 'Product not found',
    [ApiResponseCode.ALL_PRODUCTS]: 'All products',
    [ApiResponseCode.ALL_GENERATORS]: 'All generators',
    [ApiResponseCode.GENERATED_LICENSE_KEYS]: 'Generated license keys',
    [ApiResponseCode.LICENSE_KEYS_LIST]: 'License keys',
    [ApiResponseCode.CORRECT_FORMAT_TELEMETRY_SAVED]: 'Correct format data saved',
    [ApiResponseCode.INCORRECT_FORMAT_TELEMETRY_SAVED]: 'Incorrect format data saved',
    [ApiResponseCode.PRODUCT_NOT_EXISTS_COUNT]: "Product doesn't exist",
    [ApiResponseCode.AVAILABLE_LICENSE_KEYS_COUNT]: 'Available license keys count',
    [ApiResponseCode.INCORRECT_DATA_CONTRACT]: 'Incorrect data found',
    [ApiResponseCode.CONTRACT_CREATED]: 'Contract created',
    [ApiResponseCode.CONTRACT_UPDATED]: 'Contract updated',
    [ApiResponseCode.CONTRACT_DELETED]: 'Contract deleted',
    [ApiResponseCode.CONTRACT_NOT_FOUND]: 'Contract not found',
    [ApiResponseCode.ALL_CONTRACTS]: 'All contracts',
    [ApiResponseCode.CONTRACT_NOT_FOUND_INFO]: 'Contract not found',
    [ApiResponseCode.CONTRACT_PRODUCT_NOT_FOUND]: 'Product not found',
    [ApiResponseCode.CONTRACT_GENERATOR_NOT_FOUND]: 'Generator not found',
    [ApiResponseCode.CONTRACT_FOUND]: 'Contract found',
    [ApiResponseCode.LICENSE_KEYS_LIMIT_REACHED]: 'License keys limit reached',
    [ApiResponseCode.CANNOT_GENERATE_QUANTITY]: 'Cannot generate this quantity',
    [ApiResponseCode.CONTRACT_LICENSE_KEYS_GENERATED]: 'Contract license keys generated',
    [ApiResponseCode.CONTRACT_LICENSE_KEY_DELETED]: 'License key deleted',
    [ApiResponseCode.CONTRACT_LICENSE_KEY_NOT_FOUND]: 'License key not found',
    [ApiResponseCode.CONTRACT_LICENSE_KEYS_DELETED]: 'License keys deleted',
    [ApiResponseCode.CONTRACT_NO_LICENSE_KEYS_FOUND]: 'No license keys found',
    [ApiResponseCode.CHANGELOG_RETRIEVED]: 'Changelog retrieved successfully',
    [ApiResponseCode.CHANGELOG_DISABLED_GLOBALLY]: 'Changelog feature is disabled globally',
    [ApiResponseCode.CHANGELOG_DISABLED_FOR_PRODUCT]: 'Changelog not enabled for this product',
    [ApiResponseCode.PRODUCT_FOUND]: 'Product information retrieved successfully',
    [ApiResponseCode.PRODUCT_PUBLIC_KEY_FOUND]: 'Public key retrieved successfully',
    [ApiResponseCode.PRODUCT_PUBLIC_KEY_NOT_FOUND]: 'Public key not available for product',
};

/**
 * Success response codes
 */
const SUCCESS_CODES = [
    ApiResponseCode.VALID_LICENSE_KEY,
    ApiResponseCode.LICENSE_ACTIVATED,
    ApiResponseCode.LICENSE_DEACTIVATED,
    ApiResponseCode.ACTIVE_LICENSE_FOUND,
    ApiResponseCode.DOWNLOADS,
    ApiResponseCode.LICENSE_KEY_ASSIGNED,
    ApiResponseCode.LICENSE_KEYS_ASSIGNED,
    ApiResponseCode.REQUEST_QUEUED,
    ApiResponseCode.ALL_PRODUCTS,
    ApiResponseCode.GENERATED_LICENSE_KEYS,
    ApiResponseCode.ALL_GENERATORS,
    ApiResponseCode.CORRECT_FORMAT_TELEMETRY_SAVED,
    ApiResponseCode.LICENSE_KEYS_CREATION_RESULT,
    ApiResponseCode.LICENSE_KEY_UPDATED,
    ApiResponseCode.LICENSE_KEY_DELETED,
    ApiResponseCode.PRODUCT_CREATED,
    ApiResponseCode.PRODUCT_UPDATED,
    ApiResponseCode.PRODUCT_DELETED,
    ApiResponseCode.METADATA_CREATED,
    ApiResponseCode.METADATA_UPDATED,
    ApiResponseCode.METADATA_DELETED,
    ApiResponseCode.PRODUCT_META_CREATED,
    ApiResponseCode.PRODUCT_META_UPDATED,
    ApiResponseCode.PRODUCT_META_DELETED,
    ApiResponseCode.LICENSE_KEYS_LIST,
    ApiResponseCode.AVAILABLE_LICENSE_KEYS_COUNT,
    ApiResponseCode.CONTRACT_CREATED,
    ApiResponseCode.CONTRACT_UPDATED,
    ApiResponseCode.CONTRACT_DELETED,
    ApiResponseCode.ALL_CONTRACTS,
    ApiResponseCode.CONTRACT_FOUND,
    ApiResponseCode.CONTRACT_LICENSE_KEYS_GENERATED,
    ApiResponseCode.CONTRACT_LICENSE_KEY_DELETED,
    ApiResponseCode.CONTRACT_LICENSE_KEYS_DELETED,
    ApiResponseCode.TELEMETRY_DATA_FOUND,
    ApiResponseCode.CHANGELOG_RETRIEVED,
    ApiResponseCode.PRODUCT_FOUND,
    ApiResponseCode.PRODUCT_PUBLIC_KEY_FOUND,
];

/**
 * Helper Functions
 */

/**
 * Get the constant name for a code (for debugging/logging)
 * 
 * @param {number} code - The response code
 * @returns {string} The constant name or 'UNKNOWN'
 */
function getName(code) {
    return CODE_NAMES[code] || 'UNKNOWN';
}

/**
 * Get human-readable message for a response code
 * 
 * @param {number} code - The response code
 * @returns {string} The message
 */
function getMessage(code) {
    return CODE_MESSAGES[code] || 'Unknown response code';
}

/**
 * Check if a code represents a success response
 * 
 * @param {number} code - The response code
 * @returns {boolean} True if success code
 */
function isSuccess(code) {
    return SUCCESS_CODES.includes(code);
}

/**
 * Check if a code represents an error response
 * 
 * @param {number} code - The response code
 * @returns {boolean} True if error code
 */
function isError(code) {
    return !isSuccess(code);
}

// Export module
module.exports = {
    ...ApiResponseCode,
    getName,
    getMessage,
    isSuccess,
    isError,
};
