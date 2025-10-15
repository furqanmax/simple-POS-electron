# Quick Start Guide - SimplePOS

Get up and running with SimplePOS in 5 minutes.

## Prerequisites

Ensure you have:
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

Verify installation:
```bash
node --version  # Should be v18+
npm --version   # Should be 9+
```

## Installation

### Step 1: Navigate to Project Directory

```bash
cd /home/eshare/wordpress-6.8.1/simple-pos-electron
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Electron
- TypeScript
- better-sqlite3
- bcrypt
- qrcode
- date-fns

**Expected time**: 2-3 minutes

### Step 3: Build the Application

```bash
npm run build
```

This compiles TypeScript to JavaScript for both main and renderer processes.

**Expected time**: 10-15 seconds

### Step 4: Run the Application

```bash
npm start
```

The SimplePOS window should open automatically!

## First Login

When the application starts, you'll see the login screen.

**Default Credentials:**
```
Username: admin
Password: admin
```

> ⚠️ **Security Warning**: Change the default password immediately!

## First Steps

### 1. Change Default Password (Recommended)

After logging in:
1. Go to **Settings** (left sidebar)
2. Look for password change option
3. Set a strong password

### 2. Explore the Dashboard

The dashboard shows:
- Today's orders and revenue
- 7-day revenue trend
- Overdue installments
- Recent orders list

### 3. Create Your First Order

1. Click **POS** in the left sidebar
2. Add items:
   - Item Name: `Coffee`
   - Quantity: `2`
   - Unit Price: `50.00`
   - Click **Add**
3. Review the order summary (Total: ₹100.00)
4. Click **Finalize & Print**

### 4. View Order History

1. Click **History** in the left sidebar
2. See your finalized order
3. Click **Print** to reprint the invoice

### 5. Add Customers

1. Click **Customers** in the left sidebar
2. Click **+ Add Customer**
3. Fill in customer details
4. Save

## Development Mode

For active development with hot reload:

```bash
npm run dev
```

This starts:
- TypeScript compiler in watch mode (main process)
- TypeScript compiler in watch mode (renderer)
- Electron app with auto-restart

**DevTools**: Press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac)

## Project Structure

```
simple-pos-electron/
├── src/
│   ├── main/           # Electron main process (Node.js)
│   ├── preload/        # Secure IPC bridge
│   ├── renderer/       # UI (HTML/CSS/TypeScript)
│   └── shared/         # Shared types & config
├── dist/               # Compiled JavaScript
├── package.json        # Dependencies & scripts
└── README.md          # Full documentation
```

## Common Tasks

### Create a Backup

1. Go to **Settings** → Backups section
2. Click **Create Backup Now**
3. Backup saved to: `~/.config/SimplePOS/backups/`

### View Database

```bash
# Linux/Mac
sqlite3 ~/.config/SimplePOS/pos.db

# Windows (PowerShell)
sqlite3 $env:APPDATA\SimplePOS\pos.db
```

### Reset Database

```bash
# Stop the app first, then:
rm ~/.config/SimplePOS/pos.db
npm start  # Will create fresh database
```

### Check Logs

**Main Process Logs**: Terminal output where you ran `npm start`

**Renderer Logs**: Open DevTools (Ctrl+Shift+I) → Console tab

## Keyboard Shortcuts

- `Ctrl+Shift+I` - Toggle DevTools (development)
- `Ctrl+R` - Reload window
- `F11` - Toggle fullscreen
- `Alt+F4` - Close window (Windows/Linux)
- `Cmd+Q` - Quit app (Mac)

## Troubleshooting

### "Cannot find module" error

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database locked error

```bash
# Kill any running instances
pkill -9 electron  # Linux/Mac
# OR TaskManager → End Electron (Windows)

# Remove lock files
rm ~/.config/SimplePOS/pos.db-wal
rm ~/.config/SimplePOS/pos.db-shm
```

### Build errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Print not working

- Check printer is connected and powered on
- Verify printer name in settings
- Try PDF generation instead (automatic fallback)
- On Linux: Check CUPS permissions

## Next Steps

Now that you're up and running:

1. **Read the full documentation**: See `README.md`
2. **Explore features**: Try creating customers, orders, backups
3. **Customize settings**: Configure bill sizes, tax settings
4. **Plan your workflow**: Understand the POS → History flow

## Getting Help

- **Documentation**: See `README.md` and `DEVELOPMENT.md`
- **Issues**: Check the project repository
- **Database schema**: See `src/main/database.ts`
- **API reference**: See `src/shared/types.ts`

## Production Deployment

When ready for production:

```bash
# Build for your platform
npm run package         # Current platform
npm run package:win     # Windows
npm run package:mac     # macOS
npm run package:linux   # Linux

# Installers will be in: ./release/
```

## System Requirements

**Minimum:**
- OS: Windows 10, macOS 10.13, Ubuntu 18.04 (or equivalent)
- RAM: 2 GB
- Disk: 200 MB free space
- Display: 1024x768

**Recommended:**
- OS: Latest stable version
- RAM: 4 GB
- Disk: 500 MB free space (for backups)
- Display: 1920x1080
- Printer: For invoice printing

## Data Location

**Database:**
- Linux: `~/.config/SimplePOS/pos.db`
- macOS: `~/Library/Application Support/SimplePOS/pos.db`
- Windows: `%APPDATA%\SimplePOS\pos.db`

**Backups:**
- Same directory → `backups/` folder

**Invoices (PDFs):**
- Same directory → `invoices/` folder

**Uploaded Images:**
- Same directory → `uploads/` folder

## License

MIT License - See LICENSE file for details.

---

**Happy Selling!** 🚀

*Powered by YourBrand*
