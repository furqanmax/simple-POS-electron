// License Testing Script
// Run this in the browser console after logging in as admin

async function testLicense() {
  console.log('=== LICENSE TESTING SUITE ===\n');
  
  // 1. Get current license info
  console.log('1. Current License Info:');
  const info = await window.posAPI.license.getInfo();
  console.log(info);
  
  // 2. Check expiry
  console.log('\n2. Expiry Status:');
  const expiry = await window.posAPI.license.checkExpiry();
  console.log(expiry);
  
  // 3. Verify license
  console.log('\n3. License Valid?');
  const valid = await window.posAPI.license.verify();
  console.log(valid);
  
  // 4. Check features
  console.log('\n4. Feature Availability:');
  const features = [
    'canExport',
    'canBackup', 
    'multipleTemplates',
    'installments',
    'advancedReports',
    'emailSupport',
    'phoneSupport'
  ];
  
  for (const feature of features) {
    const available = await window.posAPI.license.checkFeature(feature);
    console.log(`  ${feature}: ${available ? '✓' : '✗'}`);
  }
  
  // 5. Check limits
  console.log('\n5. Usage Limits:');
  const userLimit = await window.posAPI.license.checkLimit('users', 5);
  const orderLimit = await window.posAPI.license.checkLimit('orders', 100);
  console.log(`  Can add 5 users? ${userLimit}`);
  console.log(`  Can add 100 orders? ${orderLimit}`);
  
  // 6. Check for updates
  console.log('\n6. Check for Updates:');
  const updates = await window.posAPI.license.checkUpdates();
  console.log(updates);
  
  console.log('\n=== TESTING COMPLETE ===');
}

// Test license activation with different plans
async function testActivation() {
  console.log('=== TESTING LICENSE ACTIVATION ===\n');
  
  // Generate test keys for different plans
  const testCases = [
    { email: 'trial@test.com', plan: 'Trial', days: 30 },
    { email: 'monthly@test.com', plan: 'Monthly', days: 30 },
    { email: 'quarterly@test.com', plan: 'Quarterly', days: 90 },
    { email: 'annual@test.com', plan: 'Annual', days: 365 }
  ];
  
  for (const test of testCases) {
    console.log(`\nGenerating ${test.plan} license for ${test.email}:`);
    try {
      const key = await window.posAPI.license.generateKey(
        test.email,
        test.plan,
        test.days
      );
      console.log(`Key: ${key.substring(0, 50)}...`);
      
      // Try to activate it
      const result = await window.posAPI.license.activate(key);
      console.log(`Activation result: ${result.success ? '✓' : '✗'} - ${result.message}`);
      
      // Check new state
      const info = await window.posAPI.license.getInfo();
      console.log(`New plan: ${info.plan}, Days: ${info.daysRemaining}`);
      
      // Revert to trial for next test
      await window.posAPI.license.deactivate();
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  
  console.log('\n=== ACTIVATION TESTING COMPLETE ===');
}

// Test error scenarios
async function testErrorCases() {
  console.log('=== TESTING ERROR CASES ===\n');
  
  // 1. Invalid license key
  console.log('1. Testing invalid license key:');
  const result1 = await window.posAPI.license.activate('invalid-key-123');
  console.log(`  Result: ${result1.success ? '✗ FAIL' : '✓ PASS'} - ${result1.message}`);
  
  // 2. Empty license key
  console.log('\n2. Testing empty license key:');
  const result2 = await window.posAPI.license.activate('');
  console.log(`  Result: ${result2.success ? '✗ FAIL' : '✓ PASS'} - ${result2.message}`);
  
  // 3. Malformed base64
  console.log('\n3. Testing malformed base64:');
  const result3 = await window.posAPI.license.activate('not-base64!@#$%');
  console.log(`  Result: ${result3.success ? '✗ FAIL' : '✓ PASS'} - ${result3.message}`);
  
  // 4. Expired license
  console.log('\n4. Testing expired license:');
  const expiredKey = await window.posAPI.license.generateKey(
    'expired@test.com',
    'Trial',
    -10 // Expired 10 days ago
  );
  const result4 = await window.posAPI.license.activate(expiredKey);
  console.log(`  Result: ${result4.success ? '✗ FAIL' : '✓ PASS'} - ${result4.message}`);
  
  console.log('\n=== ERROR TESTING COMPLETE ===');
}

// Export functions for console use
window.testLicense = testLicense;
window.testActivation = testActivation;
window.testErrorCases = testErrorCases;

console.log('License testing functions loaded!');
console.log('Run these commands:');
console.log('  testLicense()    - Test current license state');
console.log('  testActivation() - Test license activation');
console.log('  testErrorCases() - Test error handling');
