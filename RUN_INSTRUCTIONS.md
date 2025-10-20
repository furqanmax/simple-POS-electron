# How to Run SimplePOS with Nuvana Licensing

## Quick Start

### 1. Build the Application
```bash
npm run build
```

### 2. Start the Application
```bash
npm start
```

Or if you need to run as root (not recommended for production):
```bash
sudo npm start
```

## What's Fixed

### ✅ License System Issues Resolved
- **Fixed**: Maximum call stack size exceeded error
- **Fixed**: Infinite recursion in license checking
- **Fixed**: Missing Nuvana database columns
- **Fixed**: Type definitions for new license methods

### ✅ Database Migration
The app now automatically:
1. Detects existing databases
2. Adds new Nuvana license columns if missing
3. Preserves existing data
4. Starts in trial mode if no license exists

## First Run Experience

When you run the app for the first time:

1. **Database Creation**
   - Creates all necessary tables
   - Runs migrations v1 through v4
   - Sets up default admin user (username: `admin`, password: `admin`)

2. **Trial Mode**
   - Automatically starts 30-day trial
   - No license key required
   - Limited to 2 users and 100 orders

3. **Login**
   - Username: `admin`
   - Password: `admin`
   - ⚠️ Change this password immediately in production!

## License Activation

### From the App Interface:
1. Log in as admin
2. Go to **Settings** tab
3. Find **License Management** section
4. Click **Activate New License**
5. Enter your license key from Nuvana
6. Click Activate

### Using Environment Variables:
1. Create `.env` file (if not exists):
   ```bash
   cp .env.example .env
   ```

2. Add your Nuvana credentials:
   ```env
   NUVANA_PRODUCT_CODE=YOUR_PRODUCT_CODE
   NUVANA_SECRET=YOUR_SECRET_KEY
   ```

3. Restart the application

## Troubleshooting

### Error: "no such column: license_key"
**Solution**: The migration should run automatically. If it doesn't:
1. Delete your database: `rm ~/.config/simple-pos-electron/pos.db`
2. Restart the app (database will be recreated)

### Error: "Maximum call stack size exceeded"
**Solution**: This has been fixed. Make sure you:
1. Rebuild the app: `npm run build`
2. Restart the application

### Error: "Could not connect to bus"
**Solution**: These are harmless Electron warnings when running as root. The app will work normally.

### License Not Activating
Check:
1. Internet connection is active
2. License key is valid
3. Not exceeding max activations
4. Correct NUVANA_SECRET in .env

## Testing Your Setup

### 1. Test Database Connection
```bash
# The app should create database at:
# Linux: ~/.config/simple-pos-electron/pos.db
# Windows: %APPDATA%/simple-pos-electron/pos.db
# macOS: ~/Library/Application Support/simple-pos-electron/pos.db
```

### 2. Test License Integration
```bash
# Set your credentials
export NUVANA_SECRET=your-secret-key
export NUVANA_PRODUCT_CODE=your-product-code

# Run test
node test-nuvana-license.js
```

### 3. Verify Trial Mode
- Start the app without any license
- Should see "Trial: 30 days remaining" in the header
- Settings should show trial limitations

## Production Deployment

### Important Security Steps:

1. **Change Default Password**
   ```sql
   -- First login with admin/admin, then change immediately
   ```

2. **Secure Environment Variables**
   ```bash
   # Never commit .env to git
   # Use proper secret management in production
   ```

3. **Run Without Root**
   ```bash
   # Create proper user for the app
   # Set correct file permissions
   # Run as non-root user
   ```

4. **Enable Backups**
   - Use the built-in backup feature
   - Schedule regular backups
   - Test restore procedures

## Features by License Type

| Feature | Trial | Monthly | Quarterly | Annual |
|---------|-------|---------|-----------|--------|
| Days Valid | 30 | 30 | 90 | 365 |
| Max Users | 2 | 5 | 10 | Unlimited |
| Max Orders | 100 | 1000 | 5000 | Unlimited |
| Data Export | ❌ | ✅ | ✅ | ✅ |
| Multiple Templates | ❌ | ✅ | ✅ | ✅ |
| Advanced Reports | ❌ | ❌ | ✅ | ✅ |
| Installments | ✅ | ✅ | ✅ | ✅ |
| Support | None | Email | Email | Phone+Email |

## Support & Documentation

- **Full Documentation**: See `NUVANA_LICENSING.md`
- **Setup Guide**: See `SETUP_NUVANA_LICENSE.md`
- **API Reference**: https://licensing.nuvanasolutions.in/#api
- **Test Script**: `test-nuvana-license.js`

## Next Steps

1. ✅ Build and start the app
2. ✅ Log in with admin/admin
3. ✅ Change admin password
4. ✅ Configure your Nuvana license (or use trial)
5. ✅ Start using SimplePOS!

---

**Note**: The app is fully functional in trial mode for 30 days. You can explore all basic features before purchasing a license.
