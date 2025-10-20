# License Enforcement System for SimplePOS

## Overview
Complete license enforcement system with trial management, grace period handling, and feature restrictions.

## License Status Types

### 1. **Valid License** (`status: 'valid'`)
- Full access to all features based on plan
- Regular license verification every hour
- Warning notifications when approaching expiration (≤7 days)

### 2. **Trial License** (`status: 'trial'`)
- 30-day trial period
- Limited to:
  - 2 users maximum
  - 100 orders maximum
  - No data export
  - No advanced reports
- Automatic enforcement of limits
- Clear trial status display

### 3. **Grace Period** (`status: 'grace'`)
- 7-day grace period after license expiration
- Limited features during grace:
  - ✗ Export functionality disabled
  - ✗ Advanced reports unavailable
  - ✗ Backup features blocked
  - ✓ Basic operations allowed
- Daily countdown notifications

### 4. **Expired License** (`status: 'expired'`)
- Complete access restriction
- Redirect to license activation page
- Options to:
  - Activate new license
  - Import offline certificate
  - Start new trial (if eligible)

### 5. **Invalid/Tampered** (`status: 'tampered'` or `'invalid'`)
- Immediate access block
- Security alert for clock tampering
- Requires system time correction

## Offline Certificate Support

### Features
- Ed25519 signature verification
- Works without internet connection
- Certificate validity period (default 30 days)
- Device binding (optional)
- Import via file or manual paste

### Certificate Management
```javascript
// Import certificate from file
await importOfflineCertificate();

// Download certificate for offline use
await downloadOfflineCertificate();

// Manual certificate upload
await uploadOfflineCertificate();
```

## Feature Availability Checking

### Usage
```javascript
// Check if a feature is available
if (isFeatureAvailable('export')) {
  // Enable export functionality
}

// Check usage limits
if (checkUsageLimits('users', currentUserCount)) {
  // Allow adding new user
}
```

### Available Features
- `export` - Data export functionality
- `backup` - Backup capabilities
- `advancedReports` - Advanced reporting
- `multipleTemplates` - Template management
- `installments` - Payment installments
- `emailSupport` - Email support access
- `phoneSupport` - Phone support access

## Trial Enforcement

### Automatic Limits
- User count monitoring
- Order count tracking
- Feature restrictions
- Visual indicators for limits

### Trial Workflow
1. Start trial with confirmation
2. 30-day countdown begins
3. Limits enforced automatically
4. Warnings as limits approach
5. Expiration handling

## Grace Period Handling

### Features During Grace
- Basic POS operations ✓
- Order creation ✓
- Customer management ✓
- Export functions ✗
- Advanced reports ✗
- Backup features ✗

### Grace Period UI
- Orange warning indicators
- Days remaining countdown
- Feature restriction notices
- Renewal prompts

## License Monitoring

### Automatic Checks
- **Every Hour**: Full license validation
- **Every 5 Minutes**: Trial limit enforcement (trial only)
- **Every Minute**: UI status update
- **On Startup**: Complete verification

### Validation Process
1. Check license validity
2. Verify offline certificate (if present)
3. Detect clock tampering
4. Enforce plan limits
5. Update UI accordingly

## UI Components

### License Status Display
- Real-time status indicator
- Days remaining counter
- Feature availability grid
- Certificate status (if offline)

### License Expired Page
- Clear status messaging
- Multiple recovery options
- Support contact information
- Debug export capability

### Settings Tab Enhancements
- License information panel
- Offline certificate details
- Feature availability matrix
- Action buttons based on status

## Error Handling

### Connection Errors
- Fallback to offline certificate
- Grace period activation
- Clear error messaging
- Retry mechanisms

### Invalid States
- Clock tampering detection
- Certificate validation failures
- Expired trial handling
- API communication errors

## Testing

### Test Scenarios
1. **Trial Expiration**
   - Set system date forward 31 days
   - Verify access blocked
   - Check recovery options

2. **Grace Period**
   - Expire license
   - Verify 7-day grace period
   - Test feature restrictions

3. **Offline Mode**
   - Import test certificate
   - Disconnect internet
   - Verify continued access

4. **Trial Limits**
   - Add users up to limit
   - Create orders up to limit
   - Verify enforcement

### Test Commands
```bash
# Verify offline certificate
node test-verify-certificate.js

# Test offline workflow
node test-offline-workflow.js

# Run comprehensive tests
node test-offline-licensing.js
```

## Configuration

### Environment Variables
```env
NUVANA_LICENSE_URL=https://licensing.nuvanasolutions.in
NUVANA_PRODUCT_CODE=SIM-POS
NUVANA_SECRET=your_secret_key
NUVANA_PUBLIC_KEY=3vReK/Bws+jn4YDEOkiMJ9xdRwRrVbyNzG14Vq2AiRM=
```

### License Plans
| Plan | Users | Orders | Export | Reports | Support |
|------|-------|--------|--------|---------|---------|
| Trial | 2 | 100 | ✗ | Basic | Email |
| Monthly | 5 | 1000 | ✓ | Basic | Email |
| Quarterly | 10 | 5000 | ✓ | Advanced | Email |
| Annual | Unlimited | Unlimited | ✓ | Advanced | Phone + Email |

## Security Features

### Protection Mechanisms
- HMAC-SHA256 API signing
- Ed25519 certificate signatures
- Clock tampering detection
- Device fingerprinting
- Monotonic time tracking

### Best Practices
1. Never modify system clock
2. Keep certificates secure
3. Regular license verification
4. Backup license keys
5. Monitor usage limits

## Troubleshooting

### Common Issues

1. **"License expired" but still in grace period**
   - Check system time
   - Verify grace days remaining
   - Use "Continue with Limited Features"

2. **"Certificate invalid" error**
   - Verify public key configuration
   - Check certificate expiry
   - Ensure proper JSON format

3. **Trial limits reached**
   - Review current usage
   - Upgrade to paid plan
   - Remove inactive users/orders

4. **Offline mode not working**
   - Import valid certificate
   - Check certificate expiry
   - Verify signature

## Support

For license-related issues:
- Check debug info: Settings > Export Debug Info
- Visit: https://licensing.nuvanasolutions.in
- Review: OFFLINE_LICENSING_GUIDE.md

## Implementation Status

### ✅ Completed
- Trial license enforcement
- Grace period handling
- Expired license blocking
- Offline certificate support
- Feature availability checking
- Usage limit enforcement
- UI status indicators
- Automatic monitoring
- Clock tamper detection

### 🔄 Future Enhancements
- License renewal reminders via email
- Usage analytics dashboard
- Multi-device sync
- License transfer capability
- Automated backup of certificates
