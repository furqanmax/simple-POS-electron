# Setting Up Nuvana Licensing - Quick Start Guide

## Issue Fixed
✅ Fixed infinite recursion error in `getLicenseInfo` that was causing "Maximum call stack size exceeded"
✅ Added database migration v4 to automatically add Nuvana license fields
✅ Updated type definitions to include all new license methods

## Quick Setup Steps

### 1. Create Your .env File
Create a `.env` file in the project root with your Nuvana credentials:

```bash
# Copy from .env.example
cp .env.example .env
```

Then edit `.env` and add your actual values:
```env
# Nuvana Licensing Configuration
NUVANA_LICENSE_URL=https://licensing.nuvanasolutions.in
NUVANA_PRODUCT_CODE=YOUR_PRODUCT_CODE_HERE
NUVANA_SECRET=YOUR_SECRET_KEY_HERE
NUVANA_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

### 2. Get Your Nuvana Credentials

1. Go to https://licensing.nuvanasolutions.in
2. Sign up or log in to your account
3. Create a new product and get:
   - Product Code
   - Secret Key (keep this secure!)
   - Public Key (for offline verification)

### 3. Build and Run

```bash
# Build the application
npm run build

# Start the application
npm start
```

### 4. License States

The app will automatically handle these states:

1. **Trial Mode** (First Launch)
   - Automatically starts a 30-day trial
   - Limited to 2 users and 100 orders
   - No license key required

2. **Activated License**
   - Enter license key in Settings > License Management
   - Full features based on your plan
   - Automatic heartbeat monitoring

3. **Expired License**
   - 7-day grace period with warnings
   - After grace period, app enters read-only mode

## Testing Your Integration

### Test with provided script:
```bash
# Set environment variables
export NUVANA_SECRET=your-secret-key
export NUVANA_PRODUCT_CODE=your-product-code

# Run test
node test-nuvana-license.js
```

### Test in the App:
1. Launch the app - it should start in trial mode
2. Go to Settings > License Management
3. Click "Activate New License"
4. Enter a valid license key from Nuvana

## Troubleshooting

### Database Already Exists
If you're upgrading from an older version:
- The migration will automatically add the new Nuvana fields
- Your existing license data will be preserved
- You'll need to activate a Nuvana license to continue after trial

### License Not Activating
1. Check internet connection
2. Verify your .env credentials are correct
3. Ensure the license key is valid and not already at max activations
4. Check the console for specific error messages

### Clock Tampering Detected
- The system detects if the system clock is rolled back
- Fix your system time and restart the application

## License Plans

| Plan | Users | Orders | Features | Support |
|------|-------|--------|----------|---------|
| Trial | 2 | 100 | Basic | None |
| Monthly | 5 | 1000 | Standard + Export | Email |
| Quarterly | 10 | 5000 | Advanced + Reports | Email |
| Annual | Unlimited | Unlimited | All Features | Phone + Email |

## Important Files

- `src/main/services/nuvana-license-client.ts` - Nuvana API client
- `src/main/services/nuvana-license-service.ts` - License service
- `src/main/handlers/license-handlers.ts` - IPC handlers
- `test-nuvana-license.js` - Testing script
- `NUVANA_LICENSING.md` - Full documentation

## Security Notes

⚠️ **Never commit your .env file to version control!**
- The `.env` file is already in `.gitignore`
- Keep your NUVANA_SECRET secure
- Rotate keys if compromised

## Need Help?

- API Documentation: https://licensing.nuvanasolutions.in/#api
- Full Guide: See `NUVANA_LICENSING.md`
- Test Script: Run `node test-nuvana-license.js`
