# Offline Licensing Guide for SimplePOS Electron

## Overview
This guide explains how to use the offline licensing feature with Nuvana's licensing server for SimplePOS Electron app.

## Configuration

### 1. Environment Variables
Create a `.env` file in the root directory with the following:

```env
# Nuvana API Configuration
NUVANA_LICENSE_URL=https://licensing.nuvanasolutions.in
NUVANA_PRODUCT_CODE=SIM-POS
NUVANA_SECRET=your_secret_key_from_nuvana_dashboard
NUVANA_PUBLIC_KEY=3vReK/Bws+jn4YDEOkiMJ9xdRwRrVbyNzG14Vq2AiRM=
```

### 2. Public Key
The public key for SIM-POS product is:
```
3vReK/Bws+jn4YDEOkiMJ9xdRwRrVbyNzG14Vq2AiRM=
```

## How Offline Licensing Works

### Online Phase (Required Once)
1. **Activate License**: The app must be activated online at least once
2. **Generate Certificate**: Download an offline certificate while online
3. **Save Certificate**: Store the certificate file securely

### Offline Phase
1. **Import Certificate**: Load the certificate when offline
2. **Local Validation**: The app validates the certificate locally using Ed25519 signature verification
3. **Time Validation**: Checks if the certificate is still within its validity period
4. **Device Validation**: Optionally validates if the certificate is for this specific device

## Using Offline Certificates in SimplePOS

### Generating an Offline Certificate

#### Via UI:
1. Go to Settings tab
2. Click "Download Offline Certificate" button
3. Save the `.nva.json` file to a secure location

#### Via API:
```javascript
const result = await window.posAPI.license.generateOfflineCertificate(30); // 30 days validity
if (result.success) {
  // Save result.certificate to file
  fs.writeFileSync('offline-cert.nva.json', JSON.stringify(result.certificate, null, 2));
}
```

### Importing an Offline Certificate

#### Via UI:
1. Go to Settings tab
2. Click "Import Offline Certificate" button
3. Select the `.nva.json` file

#### Via API:
```javascript
const certData = fs.readFileSync('offline-cert.nva.json', 'utf8');
const result = await window.posAPI.license.uploadOfflineCertificate(certData);
if (result.success) {
  console.log('Certificate loaded successfully');
}
```

### Manual Upload:
1. Click "Import Offline Certificate"
2. Paste the certificate JSON directly
3. Click "Upload Certificate"

## Certificate Format

A valid offline certificate has the following structure:

```json
{
  "payload": {
    "type": "offline_cert",
    "version": 1,
    "product_code": "SIM-POS",
    "license_key": "SIM-POS-XXXX-XXXX-XXXX-XXXX",
    "device_hash": "device_identifier",
    "device_name": "Device Name",
    "app_version": "1.0.0",
    "issued_at": "2025-10-20T08:50:04+00:00",
    "valid_until": "2025-11-03T08:50:04+00:00",
    "constraints": {
      "max_activations": 1
    }
  },
  "signature": "base64_encoded_signature",
  "alg": "Ed25519",
  "version": 1
}
```

## Validation Process

The offline certificate validation includes:

1. **Structure Validation**: Checks for required fields
2. **Signature Verification**: Validates Ed25519 signature using public key
3. **Time Window Check**: Ensures certificate hasn't expired
4. **Certificate Type**: Validates it's an "offline_cert" type
5. **Device Hash**: Optionally validates device binding

## Testing

### Test Certificate Verification
Run the test script to verify certificate validation:

```bash
node test-verify-certificate.js
```

### Run Complete Test Suite
```bash
node test-offline-licensing.js
```

## Error Handling

Common error messages and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `bad_certificate` | Invalid structure | Ensure certificate has all required fields |
| `bad_signature` | Signature verification failed | Check public key and certificate integrity |
| `expired_offline_cert` | Certificate has expired | Generate a new certificate |
| `invalid_cert_type` | Wrong certificate type | Ensure certificate type is "offline_cert" |
| `Certificate is not valid for this device` | Device hash mismatch | Generate certificate for this specific device |

## Security Considerations

1. **Store Securely**: Keep certificate files in a secure location
2. **Don't Share**: Certificates may be device-specific
3. **Regular Updates**: Generate new certificates before expiry
4. **Backup**: Keep backups of valid certificates
5. **Time Sync**: Ensure system time is accurate

## API Reference

### Generate Offline Certificate
```typescript
generateOfflineCertificate(validDays?: number): Promise<{
  success: boolean;
  certificate?: any;
  message: string;
}>
```

### Upload Offline Certificate
```typescript
uploadOfflineCertificate(certificateData: string | object): Promise<{
  success: boolean;
  message: string;
}>
```

### Import from File
```typescript
importOfflineCertificate(): Promise<{
  success: boolean;
  message: string;
}>
```

### Check Offline Mode
```typescript
isOfflineMode(): Promise<boolean>
```

## Troubleshooting

### Certificate Won't Import
- Check JSON format is valid
- Verify certificate hasn't expired
- Ensure public key matches

### Signature Verification Fails
- Verify public key is correct: `3vReK/Bws+jn4YDEOkiMJ9xdRwRrVbyNzG14Vq2AiRM=`
- Check certificate hasn't been modified
- Ensure payload order matches original

### Device Hash Issues
- The sample certificate uses placeholder device hash "123546"
- For production, generate certificates with actual device hash
- Device validation can be disabled for testing

## Support

For issues or questions:
- Check the test scripts: `test-verify-certificate.js`
- Review error logs in the console
- Contact support with certificate details (without signature)

## Example Workflow

1. **Online Activation**:
   ```bash
   # User activates license online
   License Key: SIM-POS-ZWGA-N6T4-LVPT-VLV3-C68A
   ```

2. **Generate Certificate** (while online):
   ```bash
   Settings > Download Offline Certificate
   # Saves: simplepos-offline-cert-2025-10-20.nva.json
   ```

3. **Go Offline**:
   ```bash
   # Disconnect from network
   ```

4. **Import Certificate**:
   ```bash
   Settings > Import Offline Certificate
   # Select saved .nva.json file
   ```

5. **Use App Offline**:
   ```bash
   # App works normally with offline certificate
   # Valid for configured duration (e.g., 30 days)
   ```

## License Plans Support

All license plans support offline certificates:
- **Trial**: 30-day certificates
- **Monthly**: 30-day certificates  
- **Quarterly**: 90-day certificates
- **Annual**: 365-day certificates

Certificate duration can be customized when generating.
