/**
 * Test script for Nuvana licensing integration
 * Usage: node test-nuvana-license.js
 */

const axios = require('axios');
const crypto = require('crypto');
const os = require('os');

// Configuration - replace with your actual values
const CONFIG = {
  baseUrl: process.env.NUVANA_LICENSE_URL || 'https://licensing.nuvanasolutions.in',
  productCode: process.env.NUVANA_PRODUCT_CODE || 'SIMPLEPOS-ELECTRON',
  secret: process.env.NUVANA_SECRET || 'your-secret-key-here'
};

// Test license key (you need to get this from Nuvana)
const TEST_LICENSE_KEY = 'your-test-license-key-here';

class NuvanaLicenseClientTest {
  constructor(baseUrl, productCode, secret) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.productCode = productCode;
    this.secret = Buffer.from(secret, 'utf8');
  }

  sign(body) {
    const raw = Buffer.from(JSON.stringify(body));
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(raw);
    return hmac.digest('base64');
  }

  async post(endpoint, body) {
    body['product_code'] = this.productCode;
    const raw = JSON.stringify(body);
    const sig = this.sign(body);

    try {
      const res = await axios.post(`${this.baseUrl}/${endpoint}`, raw, {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': sig,
        },
        timeout: 10000,
      });
      return res.data;
    } catch (err) {
      if (err.response) {
        return err.response.data;
      }
      return { ok: false, error: err?.message || 'Network error' };
    }
  }

  getDeviceHash() {
    const cpus = os.cpus();
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const networkInterfaces = os.networkInterfaces();
    
    let mac = '';
    for (const name of Object.keys(networkInterfaces)) {
      const interfaces = networkInterfaces[name];
      if (interfaces) {
        for (const iface of interfaces) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            mac = iface.mac;
            break;
          }
        }
      }
      if (mac) break;
    }
    
    const deviceInfo = `${hostname}-${platform}-${arch}-${mac}-${cpus[0]?.model || 'unknown'}`;
    return crypto.createHash('sha256').update(deviceInfo).digest('hex');
  }

  async testIssue() {
    console.log('\n📝 Testing License Issue...');
    const result = await this.post('issue', {
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      max_activations: 2
    });
    
    if (result.ok) {
      console.log('✅ License issued successfully!');
      console.log('   License Key:', result.license_key);
      console.log('   Customer:', result.customer_email);
      return result.license_key;
    } else {
      console.log('❌ Failed to issue license:', result.error);
      return null;
    }
  }

  async testVerify(licenseKey) {
    console.log('\n🔍 Testing License Verification...');
    const result = await this.post('verify', { license_key: licenseKey });
    
    if (result.ok) {
      console.log('✅ License verified successfully!');
      console.log('   Status:', result.status);
      console.log('   Customer:', result.customer_email);
      console.log('   Expires:', result.expires_at);
      console.log('   Activations:', result.activations_used, '/', result.max_activations);
      console.log('   Metadata:', JSON.stringify(result.metadata || {}));
    } else {
      console.log('❌ Failed to verify license:', result.error);
    }
    return result;
  }

  async testActivate(licenseKey) {
    console.log('\n🚀 Testing License Activation...');
    const deviceHash = this.getDeviceHash();
    const deviceName = `${os.hostname()} (${os.platform()})`;
    
    console.log('   Device Hash:', deviceHash);
    console.log('   Device Name:', deviceName);
    
    const result = await this.post('activate', {
      license_key: licenseKey,
      device_hash: deviceHash,
      device_name: deviceName,
      app_version: '1.0.0'
    });
    
    if (result.ok) {
      console.log('✅ License activated successfully!');
      console.log('   Activation ID:', result.activation_id);
      console.log('   Activated At:', result.activated_at);
    } else {
      console.log('❌ Failed to activate license:', result.error);
    }
    return result;
  }

  async testHeartbeat(licenseKey) {
    console.log('\n💓 Testing License Heartbeat...');
    const deviceHash = this.getDeviceHash();
    
    const result = await this.post('heartbeat', {
      license_key: licenseKey,
      device_hash: deviceHash
    });
    
    if (result.ok) {
      console.log('✅ Heartbeat sent successfully!');
      console.log('   Last Seen:', result.last_seen);
    } else {
      console.log('❌ Failed to send heartbeat:', result.error);
    }
    return result;
  }

  async testListActivations(licenseKey) {
    console.log('\n📋 Testing List Activations...');
    const result = await this.post('list_activations', {
      license_key: licenseKey
    });
    
    if (result.ok) {
      console.log('✅ Activations retrieved successfully!');
      if (result.activations && result.activations.length > 0) {
        result.activations.forEach((activation, index) => {
          console.log(`   Activation ${index + 1}:`);
          console.log(`     - Device: ${activation.device_name}`);
          console.log(`     - Hash: ${activation.device_hash}`);
          console.log(`     - Activated: ${activation.activated_at}`);
          console.log(`     - Last Seen: ${activation.last_seen}`);
        });
      } else {
        console.log('   No activations found');
      }
    } else {
      console.log('❌ Failed to list activations:', result.error);
    }
    return result;
  }

  async testDeactivate(licenseKey) {
    console.log('\n🛑 Testing License Deactivation...');
    const deviceHash = this.getDeviceHash();
    
    const result = await this.post('deactivate', {
      license_key: licenseKey,
      device_hash: deviceHash
    });
    
    if (result.ok) {
      console.log('✅ License deactivated successfully!');
    } else {
      console.log('❌ Failed to deactivate license:', result.error);
    }
    return result;
  }

  async testOfflineCertificate(licenseKey) {
    console.log('\n📜 Testing Offline Certificate Generation...');
    const result = await this.post('generate_offline_certificate', {
      license_key: licenseKey
    });
    
    if (result.ok && result.certificate) {
      console.log('✅ Offline certificate generated successfully!');
      console.log('   Algorithm:', result.certificate.alg);
      console.log('   Version:', result.certificate.version);
      console.log('   Valid Until:', result.certificate.payload?.valid_until);
      
      // Test offline verification
      if (process.env.NUVANA_PUBLIC_KEY) {
        console.log('\n🔐 Testing Offline Verification...');
        const nacl = require('tweetnacl');
        
        try {
          const payload = result.certificate.payload;
          const sigB64 = result.certificate.signature;
          const raw = Buffer.from(JSON.stringify(payload));
          const sig = Buffer.from(sigB64, 'base64');
          const pk = Buffer.from(process.env.NUVANA_PUBLIC_KEY.replace('base64:', ''), 'base64');
          
          const valid = nacl.sign.detached.verify(raw, sig, pk);
          if (valid) {
            console.log('✅ Offline certificate verification passed!');
          } else {
            console.log('❌ Offline certificate verification failed!');
          }
        } catch (err) {
          console.log('❌ Error during offline verification:', err.message);
        }
      } else {
        console.log('⚠️  Skipping offline verification (no public key configured)');
      }
    } else {
      console.log('❌ Failed to generate offline certificate:', result.error);
    }
    return result;
  }

  async testRevoke(licenseKey) {
    console.log('\n🚫 Testing License Revocation...');
    const result = await this.post('revoke', {
      license_key: licenseKey
    });
    
    if (result.ok) {
      console.log('✅ License revoked successfully!');
    } else {
      console.log('❌ Failed to revoke license:', result.error);
    }
    return result;
  }
}

async function runTests() {
  console.log('🧪 Nuvana License API Test Suite');
  console.log('================================');
  console.log('Configuration:');
  console.log('  Base URL:', CONFIG.baseUrl);
  console.log('  Product Code:', CONFIG.productCode);
  console.log('  Secret:', CONFIG.secret === 'your-secret-key-here' ? '❌ NOT CONFIGURED' : '✅ Configured');
  
  if (CONFIG.secret === 'your-secret-key-here') {
    console.log('\n⚠️  Please configure your Nuvana secret key in the environment variables!');
    console.log('   Set NUVANA_SECRET=your-actual-secret-key');
    return;
  }

  const client = new NuvanaLicenseClientTest(CONFIG.baseUrl, CONFIG.productCode, CONFIG.secret);

  try {
    let licenseKey = TEST_LICENSE_KEY;
    
    // Test 1: Issue a new license (optional - comment out if you want to use an existing license)
    if (licenseKey === 'your-test-license-key-here') {
      const issuedKey = await client.testIssue();
      if (issuedKey) {
        licenseKey = issuedKey;
        console.log('\n📌 Using newly issued license for tests:', licenseKey);
      } else {
        console.log('\n⚠️  Could not issue license. Please provide a valid license key.');
        return;
      }
    }

    // Test 2: Verify license
    const verifyResult = await client.testVerify(licenseKey);
    
    if (verifyResult.ok) {
      // Test 3: Activate license
      await client.testActivate(licenseKey);
      
      // Test 4: Send heartbeat
      await client.testHeartbeat(licenseKey);
      
      // Test 5: List activations
      await client.testListActivations(licenseKey);
      
      // Test 6: Generate offline certificate
      await client.testOfflineCertificate(licenseKey);
      
      // Test 7: Deactivate license
      await client.testDeactivate(licenseKey);
      
      // Test 8: Revoke license (optional - this will permanently revoke the license)
      // Uncomment only if you want to test revocation
      // await client.testRevoke(licenseKey);
    }
    
    console.log('\n✅ Test suite completed!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests
runTests().catch(console.error);
