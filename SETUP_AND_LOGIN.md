# SimplePOS Setup and Login Guide

## Default Login Credentials
- **Username:** `admin`
- **Password:** `admin`

## Running the Application

### Option 1: Run as regular user (RECOMMENDED)
```bash
npm start
```

### Option 2: Run as root (Development only)
```bash
sudo npm start
```
The app will automatically detect root and add `--no-sandbox` flag.

## Troubleshooting Login Issues

### 1. Check if database exists
When running with sudo, the database is created in root's config directory.
```bash
# Check root's database
sudo ls -la /root/.config/simple-pos-electron/

# Check user's database
ls -la ~/.config/simple-pos-electron/
```

### 2. Reset the database
If login doesn't work, reset the database:
```bash
# For root (if running with sudo)
sudo rm -rf /root/.config/simple-pos-electron/

# For regular user
rm -rf ~/.config/simple-pos-electron/

# Then restart the app
npm start
```

### 3. Check console logs
When you start the app, you should see:
```
[DB] User data path: /path/to/config
[DB] Database path: /path/to/config/pos.db
[DB] Initializing database at: /path/to/config/pos.db
[DB] Ensuring seed data...
[DB] Users count: 0
[DB] Creating default admin user...
[DB] ✓ Admin user created
[DB] Database initialization complete
```

When you try to login, you should see:
```
[RENDERER] Login attempt with username: admin
[RENDERER] Calling posAPI.auth.login...
[AUTH] Login attempt for username: admin
[AUTH] User found, verifying password...
[AUTH] Login successful for user: admin
[RENDERER] Login response: {id: 1, username: 'admin', role: 'admin', ...}
[RENDERER] Login successful, updating UI...
```

### 4. Verify admin user in database
```bash
# Check if admin user exists
sqlite3 /root/.config/simple-pos-electron/pos.db "SELECT id, username, role, active FROM users;"
```

Should output:
```
1|admin|admin|1
```

## Known Issues

### Bus Connection Errors (Harmless)
When running as root, you'll see these errors:
```
[ERROR:bus.cc(407)] Failed to connect to the bus: Could not parse server address...
```
These are Chromium/DBus warnings and can be safely ignored. They don't affect functionality.

### Permission Issues
If you get permission errors with node_modules:
```bash
# Fix ownership (replace 'eshare' with your username)
sudo chown -R eshare:eshare /home/eshare/wordpress-6.8.1/simple-pos-electron/

# Or clean reinstall
rm -rf node_modules package-lock.json
npm install
```

## Application Features

### Phase 1 & 2 (Completed)
- ✅ Login/Logout
- ✅ Role-based access control (admin/user)
- ✅ User management (create, activate/deactivate, change role, delete)
- ✅ Change password
- ✅ Dashboard with stats

### Phase 3 (Completed)
- ✅ POS order entry
- ✅ Customer search and selection
- ✅ Customer creation
- ✅ Frequent items (save/apply)
- ✅ Open orders (save/load/delete tickets)
- ✅ Order finalization
- ✅ Print/PDF generation

### Phase 4-8 (Pending)
- ⏳ Invoice template manager
- ⏳ Installments UI
- ⏳ License management UI
- ⏳ Backup/restore UI

## Development Scripts

```bash
# Build only
npm run build

# Development mode with watch
npm run dev

# Reset database
node scripts/reset-db.js

# Package for distribution
npm run package
npm run package:linux
npm run package:win
npm run package:mac
```

## Architecture

- **Main Process:** `src/main/` - Electron main process, database, IPC handlers
- **Renderer Process:** `src/renderer/` - UI logic (HTML/CSS/TypeScript)
- **Preload Script:** `src/preload/` - Secure IPC bridge
- **Shared Types:** `src/shared/` - TypeScript interfaces
- **Database:** SQLite with better-sqlite3
- **Build Output:** `dist/`

## Security Notes

1. **Never run production apps as root** - The `--no-sandbox` flag is a security risk
2. **Change default password** - After first login, change the admin password
3. **Database encryption** - Consider encrypting the SQLite database for production
4. **IPC security** - All IPC is validated and role-checked on the main process

## Support

If login still doesn't work after following these steps:
1. Check the terminal console logs
2. Open DevTools in the app (Ctrl+Shift+I) and check the Console tab
3. Verify the database file exists and has the admin user
4. Try resetting the database completely
