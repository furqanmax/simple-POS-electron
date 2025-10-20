/**
 * Test script to verify the Nuvana offline certificate
 */

const nacl = require('tweetnacl');
const fs = require('fs');

// The actual certificate from Nuvana
const certificate = {
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

// The public key from Nuvana
const publicKeyBase64 = '3vReK/Bws+jn4YDEOkiMJ9xdRwRrVbyNzG14Vq2AiRM=';

function verifyOfflineCertificate(cert, publicKeyB64) {
    console.log('🔍 Starting certificate verification...\n');
    
    // Check certificate structure
    if (!cert?.payload || !cert?.signature || cert?.alg !== "Ed25519") {
        return { ok: false, error: "bad_certificate" };
    }
    console.log('✅ Certificate structure is valid');
    
    // Prepare data for verification
    const payloadStr = JSON.stringify(cert.payload);
    console.log('\n📄 Payload string (first 100 chars):', payloadStr.substring(0, 100) + '...');
    
    const sig = Buffer.from(cert.signature, "base64");
    console.log('🔑 Signature length:', sig.length, 'bytes');
    
    const pk = Buffer.from(publicKeyB64, "base64");
    console.log('🔐 Public key length:', pk.length, 'bytes');
    
    // Verify signature
    try {
        const encoder = new TextEncoder();
        const payloadBytes = encoder.encode(payloadStr);
        console.log('📦 Payload bytes length:', payloadBytes.length);
        
        const ok = nacl.sign.detached.verify(
            payloadBytes,
            new Uint8Array(sig),
            new Uint8Array(pk)
        );
        
        if (!ok) {
            console.log('❌ Signature verification failed');
            return { ok: false, error: "bad_signature" };
        }
        console.log('✅ Signature verification passed');
    } catch (error) {
        console.error('❌ Verification error:', error.message);
        return { ok: false, error: "bad_signature" };
    }
    
    // Validate time window
    const now = new Date();
    const validUntil = new Date(cert.payload.valid_until);
    const issuedAt = new Date(cert.payload.issued_at);
    
    console.log('\n📅 Time validation:');
    console.log('  Issued at:    ', issuedAt.toISOString());
    console.log('  Current time: ', now.toISOString());
    console.log('  Valid until:  ', validUntil.toISOString());
    console.log('  Days remaining:', Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24)));
    
    if (now > validUntil) {
        console.log('❌ Certificate has expired');
        return { ok: false, error: "expired_offline_cert" };
    }
    console.log('✅ Certificate is within valid time window');
    
    // Validate certificate type
    if (cert.payload.type !== "offline_cert") {
        console.log('❌ Invalid certificate type:', cert.payload.type);
        return { ok: false, error: "invalid_cert_type" };
    }
    console.log('✅ Certificate type is correct');
    
    return { ok: true, payload: cert.payload };
}

// Run the verification
console.log('========================================');
console.log('  Nuvana Offline Certificate Verifier');
console.log('========================================\n');

console.log('Certificate Details:');
console.log('  License Key:', certificate.payload.license_key);
console.log('  Product Code:', certificate.payload.product_code);
console.log('  Device Hash:', certificate.payload.device_hash);
console.log('  Max Activations:', certificate.payload.constraints.max_activations);
console.log('');

const result = verifyOfflineCertificate(certificate, publicKeyBase64);

console.log('\n========================================');
console.log('  Final Result');
console.log('========================================');
if (result.ok) {
    console.log('✅ CERTIFICATE IS VALID');
    console.log('\nExtracted Information:');
    console.log('  License Key:', result.payload.license_key);
    console.log('  Product Code:', result.payload.product_code);
    console.log('  Valid Until:', new Date(result.payload.valid_until).toLocaleDateString());
    console.log('  Device Hash:', result.payload.device_hash);
    
    // Save certificate to file for testing (only if not called as module)
    if (require.main === module) {
        try {
            const certPath = 'test-certificate.nva.json';
            fs.writeFileSync(certPath, JSON.stringify(certificate, null, 2));
            console.log(`\n📁 Certificate saved to ${certPath} for testing`);
        } catch (error) {
            console.log(`\n⚠️ Could not save certificate file: ${error.message}`);
        }
    }
} else {
    console.log('❌ CERTIFICATE IS INVALID');
    console.log('  Error:', result.error);
}

// Test with modified certificate (should fail)
console.log('\n========================================');
console.log('  Testing Modified Certificate');
console.log('========================================');

const modifiedCert = JSON.parse(JSON.stringify(certificate));
modifiedCert.payload.license_key = 'MODIFIED-KEY';

const modifiedResult = verifyOfflineCertificate(modifiedCert, publicKeyBase64);
console.log('\nModified certificate result:', modifiedResult.ok ? '❌ UNEXPECTED PASS' : '✅ CORRECTLY FAILED');

// Test with expired certificate
console.log('\n========================================');
console.log('  Testing Expired Certificate');
console.log('========================================');

const expiredCert = JSON.parse(JSON.stringify(certificate));
expiredCert.payload.valid_until = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const expiredResult = verifyOfflineCertificate(expiredCert, publicKeyBase64);
console.log('\nExpired certificate result:', expiredResult.ok ? '❌ UNEXPECTED PASS' : '✅ CORRECTLY FAILED');

module.exports = { verifyOfflineCertificate };
