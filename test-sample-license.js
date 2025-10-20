/**
 * Sample License Testing Script
 * This demonstrates how to test the Nuvana licensing system with sample values
 */

// ================================================
// SAMPLE LICENSE DATA STRUCTURES
// ================================================

// Sample License Key (what you would enter in the app)
const SAMPLE_LICENSE_KEY = "NUV-PRO-A1B2-C3D4-E5F6-G7H8-I9J0-K1L2-M3N4-O5P6-Q7R8-S9T0-2024";

// Sample API Response from Nuvana verify endpoint
const SAMPLE_VERIFY_RESPONSE = {
  ok: true,
  license_key: "NUV-PRO-A1B2-C3D4-E5F6-G7H8-I9J0-K1L2-M3N4-O5P6-Q7R8-S9T0-2024",
  product_code: "TEST-SIMPLEPOS-2024",
  customer_email: "john.doe@example.com",
  customer_name: "John Doe",
  status: "active",
  created_at: "2024-01-15T10:30:00Z",
  expires_at: "2025-01-15T23:59:59Z",
  max_activations: 3,
  activations_used: 1,
  metadata: {
    plan: "annual",
    features: {
      max_users: -1,  // -1 means unlimited
      max_orders: -1,
      can_export: true,
      can_backup: true,
      multiple_templates: true,
      installments: true,
      advanced_reports: true,
      email_support: true,
      phone_support: true
    }
  }
};

// Sample API Response from activate endpoint
const SAMPLE_ACTIVATE_RESPONSE = {
  ok: true,
  activation_id: "act_1234567890abcdef",
  activated_at: "2024-10-20T08:30:00Z",
  device_hash: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
  device_name: "John's Desktop (linux)",
  app_version: "1.0.0"
};

// Sample Offline Certificate
const SAMPLE_OFFLINE_CERTIFICATE = {
  alg: "Ed25519",
  version: 1,
  payload: {
    license_key: "NUV-PRO-A1B2-C3D4-E5F6-G7H8-I9J0-K1L2-M3N4-O5P6-Q7R8-S9T0-2024",
    product_code: "TEST-SIMPLEPOS-2024",
    customer_email: "john.doe@example.com",
    valid_until: "2025-02-15T23:59:59Z",  // 30 days from generation
    features: {
      max_users: -1,
      max_orders: -1,
      can_export: true,
      can_backup: true,
      multiple_templates: true,
      installments: true,
      advanced_reports: true
    }
  },
  signature: "MEUCIQDLKJHGfdsakjhgfd7632jkhgfdKJHGkjhgfd8732kjhgfdsaIgYUhjgfds98732kjhgfdsakjhgfd87321kjhgfds=="
};

// Sample Activations List
const SAMPLE_ACTIVATIONS_LIST = [
  {
    activation_id: "act_1234567890abcdef",
    device_hash: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    device_name: "John's Desktop (linux)",
    activated_at: "2024-10-20T08:30:00Z",
    last_seen: "2024-10-20T12:00:00Z",
    app_version: "1.0.0"
  },
  {
    activation_id: "act_0987654321fedcba",
    device_hash: "b2c3d4e5f678901234567890123456789012345678901234567890123456789012",
    device_name: "John's Laptop (windows)",
    activated_at: "2024-10-18T14:20:00Z",
    last_seen: "2024-10-19T18:45:00Z",
    app_version: "1.0.0"
  }
];

// ================================================
// TEST CONFIGURATION
// ================================================

const TEST_CONFIG = {
  // API Endpoint
  baseUrl: "https://licensing.nuvanasolutions.in",
  
  // Your Product Configuration (from Nuvana Dashboard)
  productCode: "TEST-SIMPLEPOS-2024",
  
  // HMAC Secret for API signing (keep secret!)
  secret: "sk_test_4eC39HqLyjWDarjtT1zdp7dc8hY5kL9mNpQrStUvWxXz",
  
  // Public Key for offline verification
  publicKey: "base64:MCowBQYDK2VwAyEAH+qM6N8Y7pMQzRhT6Xn5fUjK2xkJFDn4L8kPz7RbqX8=",
  
  // Test Device Info
  deviceInfo: {
    deviceHash: require('crypto').createHash('sha256').update(`test-device-${Date.now()}`).digest('hex'),
    deviceName: `Test Device (${process.platform})`,
    appVersion: "1.0.0"
  }
};

// ================================================
// HOW TO TEST IN YOUR APP
// ================================================

console.log("========================================");
console.log("SAMPLE LICENSE TESTING INFORMATION");
console.log("========================================\n");

console.log("1. CONFIGURE YOUR .env FILE:");
console.log("-----------------------------");
console.log(`NUVANA_LICENSE_URL=${TEST_CONFIG.baseUrl}`);
console.log(`NUVANA_PRODUCT_CODE=${TEST_CONFIG.productCode}`);
console.log(`NUVANA_SECRET=${TEST_CONFIG.secret}`);
console.log(`NUVANA_PUBLIC_KEY=${TEST_CONFIG.publicKey}`);
console.log();

console.log("2. SAMPLE LICENSE KEY TO TEST:");
console.log("-------------------------------");
console.log(SAMPLE_LICENSE_KEY);
console.log();

console.log("3. EXPECTED BEHAVIOR:");
console.log("---------------------");
console.log("- Plan: Annual (Unlimited)");
console.log("- Expires: January 15, 2025");
console.log("- Max Activations: 3");
console.log("- Current Activations: 1");
console.log("- Features: All enabled");
console.log();

console.log("4. TEST SCENARIOS:");
console.log("------------------");
console.log("a) Valid License: Use the sample key above");
console.log("b) Expired License: Change expires_at to past date");
console.log("c) Max Activations: Set activations_used = max_activations");
console.log("d) Invalid Key: Use 'INVALID-KEY-12345'");
console.log("e) Network Error: Disconnect internet");
console.log("f) Clock Tampering: Change system time to past");
console.log();

console.log("5. MOCK API RESPONSES:");
console.log("----------------------");
console.log("Verify Response:", JSON.stringify(SAMPLE_VERIFY_RESPONSE, null, 2));
console.log();
console.log("Activate Response:", JSON.stringify(SAMPLE_ACTIVATE_RESPONSE, null, 2));
console.log();

console.log("6. TESTING IN THE APP:");
console.log("----------------------");
console.log("1. Start the app: npm start");
console.log("2. Go to Settings > License Management");
console.log("3. Click 'Activate License'");
console.log("4. Enter the sample license key");
console.log("5. Click 'Activate'");
console.log();

console.log("7. LICENSE KEY FORMATS BY PLAN:");
console.log("--------------------------------");
const licensePlans = {
  "Trial (30 days)": "NUV-TRIAL-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-2024",
  "Monthly": "NUV-MTH01-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-2024",
  "Quarterly": "NUV-QTR03-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-2024",
  "Annual": "NUV-ANN12-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-2024"
};

for (const [plan, format] of Object.entries(licensePlans)) {
  console.log(`${plan}: ${format}`);
}
console.log();

console.log("8. DEVICE HASH EXAMPLE:");
console.log("------------------------");
console.log(`Current Device Hash: ${TEST_CONFIG.deviceInfo.deviceHash}`);
console.log(`Device Name: ${TEST_CONFIG.deviceInfo.deviceName}`);
console.log();

console.log("========================================");
console.log("IMPORTANT NOTES:");
console.log("========================================");
console.log("⚠️  These are SAMPLE values for testing only!");
console.log("⚠️  Get real license keys from: https://licensing.nuvanasolutions.in");
console.log("⚠️  Never share your SECRET key publicly!");
console.log("⚠️  Real license keys are cryptographically signed");
console.log();

// Export for use in other test files
module.exports = {
  SAMPLE_LICENSE_KEY,
  SAMPLE_VERIFY_RESPONSE,
  SAMPLE_ACTIVATE_RESPONSE,
  SAMPLE_OFFLINE_CERTIFICATE,
  SAMPLE_ACTIVATIONS_LIST,
  TEST_CONFIG
};
