# Test and Run Instructions

## Quick Start

### 1. Start the Application
```bash
npm start
```

### 2. Login Credentials
- **Username:** `admin`
- **Password:** `admin`

### 3. Expected Behavior

#### On Application Start:
1. Terminal shows:
   ```
   App is ready, initializing database...
   [DB] User data path: /home/eshare/.config/simple-pos-electron
   [DB] Database path: /home/eshare/.config/simple-pos-electron/pos.db
   [DB] Initializing database at: /home/eshare/.config/simple-pos-electron/pos.db
   [DB] Ensuring seed data...
   [DB] Users count: 1
   [DB] Users already exist, skipping admin creation
   [DB] Database initialization complete
   Database initialized successfully
   Registering IPC handlers...
   All IPC handlers registered
   ```

2. Electron window opens showing login page

#### On Login Attempt:
1. Enter username: `admin`
2. Enter password: `admin`
3. Click "Login" button
4. Terminal shows:
   ```
   [RENDERER] Login attempt with username: admin
   [RENDERER] Calling posAPI.auth.login...
   [AUTH] Login attempt for username: admin
   [AUTH] User found, verifying password...
   [AUTH] Login successful for user: admin
   [RENDERER] Login response: {id: 1, username: 'admin', role: 'admin', ...}
   [RENDERER] Login successful, updating UI...
   ```

5. Login page disappears
6. Main app interface appears with navigation menu
7. Dashboard page loads showing:
   - Today's Orders
   - Today's Revenue
   - 7-Day Revenue
   - Overdue Installments
   - Recent Orders table

## Troubleshooting

### If Login Page Doesn't Appear
1. Open DevTools: Press `Ctrl+Shift+I` or `F12`
2. Check Console tab for JavaScript errors
3. Check Network tab to verify `renderer/app.js` loaded (status 200)

### If Login Fails
1. Check terminal for `[AUTH]` log messages
2. Verify admin user exists:
   ```bash
   sqlite3 ~/.config/simple-pos-electron/pos.db "SELECT * FROM users WHERE username='admin';"
   ```
3. Reset database if needed:
   ```bash
   rm -rf ~/.config/simple-pos-electron/
   npm start
   ```

### If Dashboard Doesn't Load After Login
1. Check browser console (DevTools) for errors
2. Verify `navigateTo('dashboard')` was called
3. Check if `renderDashboard()` function executes

## Verification Steps

### Step 1: Verify Build
```bash
npm run build
# Should complete without errors
# Should show: "Copied ... index.html" and "Copied ... styles.css"
```

### Step 2: Verify Database
```bash
sqlite3 ~/.config/simple-pos-electron/pos.db "SELECT id, username, role, active FROM users;"
# Should output: 1|admin|admin|1
```

### Step 3: Verify File Structure
```bash
ls -la dist/renderer/
# Should show: index.html, styles.css, renderer/ directory

ls -la dist/renderer/renderer/
# Should show: app.js, app.js.map
```

## Common Issues and Fixes

### Issue: "Cannot find module"
**Fix:** Rebuild the project
```bash
npm run build
```

### Issue: Database locked
**Fix:** Close all instances of the app
```bash
pkill -f electron
npm start
```

### Issue: Permission denied
**Fix:** Check file ownership
```bash
ls -la ~/.config/simple-pos-electron/
# If owned by root, fix with:
sudo chown -R $USER:$USER ~/.config/simple-pos-electron/
```

### Issue: App starts but window is blank
**Fix:** Check if HTML file exists and is loaded
```bash
cat dist/renderer/index.html | head -20
# Should show HTML content
```

## Testing the Complete Flow

1. **Start App:** `npm start`
2. **Wait for Window:** Should open within 3-5 seconds
3. **Check Login Page:** Should see "SimplePOS" title and login form
4. **Enter Credentials:** admin / admin
5. **Click Login:** Button should be clickable
6. **Wait for Response:** Should take < 1 second
7. **Verify Dashboard:** Should see navigation menu and dashboard content
8. **Test Navigation:** Click on different menu items (POS, History, etc.)
9. **Test Logout:** Click logout button, should return to login page
10. **Re-login:** Should work again with same credentials

## Success Criteria

✅ Application starts without errors
✅ Login page displays correctly
✅ Login with admin/admin succeeds
✅ Dashboard loads and displays stats
✅ Navigation between pages works
✅ Logout returns to login page
✅ No JavaScript errors in console
✅ No critical errors in terminal
