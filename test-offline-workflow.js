#!/usr/bin/env node

/**
 * Test Offline Certificate Workflow
 * 
 * This script demonstrates the complete offline licensing workflow:
 * 1. Verify the provided certificate
 * 2. Save certificate to file
 * 3. Simulate offline mode
 * 4. Load and validate certificate
 */

const fs = require('fs').promises;
const path = require('path');
const { verifyOfflineCertificate } = require('./test-verify-certificate');

// The actual test certificate from Nuvana
const testCertificate = {
    "payload": {
        "type": "offline_cert",
        "version": 1,
        "product_code": "SIM-POS",
        "license_key": "SIM-POS-ZWGA-N6T4-LVPT-VLV3-C68A",
        "device_hash": "123546",
        "device_name": null,
        "app_version": null,
        "issued_at": "2025-10-20T08:50:04+00:00",
        "valid_until": "2025-11-03T08:50:04+00:00",
        "constraints": {
            "max_activations": 1
        }
    },
    "signature": "Wr93oKDkomUXlWOcIyu4wlyfjMANbavFNlwvPX3XfgUtUn1CM+ItX+nK/EqMOGI84uF57iGCMsj5X0638lGRBA==",
    "alg": "Ed25519",
    "version": 1
};

const publicKey = '3vReK/Bws+jn4YDEOkiMJ9xdRwRrVbyNzG14Vq2AiRM=';

async function testOfflineWorkflow() {
    console.log('========================================');
    console.log('  Offline Certificate Workflow Test');
    console.log('========================================\n');
    
    // Step 1: Verify Certificate
    console.log('📋 Step 1: Verifying Certificate');
    console.log('---------------------------------');
    const verifyResult = verifyOfflineCertificate(testCertificate, publicKey);
    
    if (!verifyResult.ok) {
        console.error('❌ Certificate verification failed:', verifyResult.error);
        return false;
    }
    
    console.log('✅ Certificate is valid');
    console.log('  License Key:', testCertificate.payload.license_key);
    console.log('  Valid Until:', new Date(testCertificate.payload.valid_until).toLocaleDateString());
    console.log('  Product Code:', testCertificate.payload.product_code);
    console.log('');
    
    // Step 2: Save Certificate to File
    console.log('💾 Step 2: Saving Certificate to File');
    console.log('------------------------------------');
    const certPath = path.join(__dirname, 'simplepos-offline-cert-test.nva.json');
    
    try {
        await fs.writeFile(certPath, JSON.stringify(testCertificate, null, 2));
        console.log('✅ Certificate saved to:', certPath);
    } catch (error) {
        console.error('❌ Failed to save certificate:', error.message);
        return false;
    }
    console.log('');
    
    // Step 3: Load Certificate from File
    console.log('📁 Step 3: Loading Certificate from File');
    console.log('---------------------------------------');
    
    try {
        const loadedData = await fs.readFile(certPath, 'utf8');
        const loadedCert = JSON.parse(loadedData);
        
        // Verify loaded certificate
        const loadedVerifyResult = verifyOfflineCertificate(loadedCert, publicKey);
        
        if (!loadedVerifyResult.ok) {
            console.error('❌ Loaded certificate verification failed:', loadedVerifyResult.error);
            return false;
        }
        
        console.log('✅ Certificate loaded and verified successfully');
    } catch (error) {
        console.error('❌ Failed to load certificate:', error.message);
        return false;
    }
    console.log('');
    
    // Step 4: Calculate Certificate Status
    console.log('📊 Step 4: Certificate Status');
    console.log('----------------------------');
    
    const now = new Date();
    const validUntil = new Date(testCertificate.payload.valid_until);
    const issuedAt = new Date(testCertificate.payload.issued_at);
    const daysRemaining = Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((validUntil - issuedAt) / (1000 * 60 * 60 * 24));
    const daysUsed = totalDays - daysRemaining;
    
    console.log('📅 Time Information:');
    console.log('  Issued:', issuedAt.toLocaleString());
    console.log('  Current:', now.toLocaleString());
    console.log('  Expires:', validUntil.toLocaleString());
    console.log('');
    
    console.log('📈 Usage Statistics:');
    console.log('  Total Days:', totalDays);
    console.log('  Days Used:', daysUsed);
    console.log('  Days Remaining:', daysRemaining);
    console.log('  Progress:', `${Math.round((daysUsed / totalDays) * 100)}%`);
    
    // Progress bar
    const progressLength = 30;
    const progressFilled = Math.round((daysUsed / totalDays) * progressLength);
    const progressBar = '█'.repeat(progressFilled) + '░'.repeat(progressLength - progressFilled);
    console.log('  [' + progressBar + ']');
    console.log('');
    
    // Step 5: Display Certificate Features
    console.log('🎯 Step 5: Certificate Features');
    console.log('------------------------------');
    console.log('  ✅ Offline Mode: Enabled');
    console.log('  ✅ Device Binding:', testCertificate.payload.device_hash === '123546' ? 'Test Mode' : 'Production');
    console.log('  ✅ Max Activations:', testCertificate.payload.constraints.max_activations);
    console.log('  ✅ Algorithm:', testCertificate.alg);
    console.log('  ✅ Version:', testCertificate.version);
    console.log('');
    
    // Step 6: Cleanup
    console.log('🧹 Step 6: Cleanup');
    console.log('----------------');
    
    const keepFile = process.argv.includes('--keep');
    if (!keepFile) {
        try {
            await fs.unlink(certPath);
            console.log('✅ Test certificate file removed');
        } catch (error) {
            console.log('⚠️ Could not remove test file:', error.message);
        }
    } else {
        console.log('📌 Keeping certificate file (--keep flag used)');
    }
    console.log('');
    
    return true;
}

// Step 7: Test Instructions
async function showInstructions() {
    console.log('========================================');
    console.log('  How to Use in SimplePOS');
    console.log('========================================\n');
    
    console.log('1️⃣ Import Certificate (Choose one method):');
    console.log('   a) File Import:');
    console.log('      - Click "Import Certificate File" in Settings');
    console.log('      - Select the .nva.json file');
    console.log('');
    console.log('   b) Manual Paste:');
    console.log('      - Click "Paste Certificate" in Settings');
    console.log('      - Paste the JSON certificate');
    console.log('      - Click "Upload Certificate"');
    console.log('');
    
    console.log('2️⃣ Verify Status:');
    console.log('   - Check the license status shows "OFFLINE MODE"');
    console.log('   - Verify certificate details are displayed');
    console.log('   - Note the expiry date and days remaining');
    console.log('');
    
    console.log('3️⃣ Test Offline:');
    console.log('   - Disconnect from internet');
    console.log('   - Restart the application');
    console.log('   - Verify the app still works');
    console.log('');
    
    console.log('4️⃣ Generate New Certificate (when online):');
    console.log('   - Connect to internet');
    console.log('   - Click "Download Certificate"');
    console.log('   - Save the new certificate');
    console.log('');
}

// Main execution
async function main() {
    try {
        const success = await testOfflineWorkflow();
        
        if (success) {
            await showInstructions();
            
            console.log('========================================');
            console.log('  ✅ All Tests Passed!');
            console.log('========================================\n');
            
            // Show the certificate for copy/paste
            if (process.argv.includes('--show-cert')) {
                console.log('📋 Certificate JSON for Testing:');
                console.log('--------------------------------');
                console.log(JSON.stringify(testCertificate, null, 2));
            }
        } else {
            console.log('========================================');
            console.log('  ❌ Tests Failed');
            console.log('========================================\n');
            process.exit(1);
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    console.log('');
    main();
}

module.exports = { testOfflineWorkflow };
