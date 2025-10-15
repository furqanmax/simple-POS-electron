# SimplePOS - Electron Point of Sale System

A comprehensive Electron-based Point of Sale system with SQLite, role-based access control, invoice templating, installment payments, and offline-first licensing.

## Features

### Core Functionality
- **Secure Authentication**: Role-based access (Admin, User, Guest)
- **Order Management**: Custom item entry, customer assignment, order finalization
- **Invoice System**: Customizable templates with logos and QR codes
- **Multi-Bill Sizes**: A3, A4, A5, Letter, Legal, Thermal (57/58/76/80mm)
- **Print & PDF**: Direct printing and PDF generation with fallback
- **Installment Plans (EMI)**: Weekly/biweekly/monthly payment schedules
- **Multi-Order Sessions**: Parallel ticket management with park/unpark
- **Dashboard Analytics**: Revenue tracking, order trends, overdue alerts
- **Backup & Restore**: One-click database backups with versioning
- **Offline-First**: Works without internet after initial activation

### Security
- Context isolation enabled
- Node integration disabled
- Secure IPC with schema validation
- Bcrypt password hashing
- SQL injection prevention

### Technology Stack
- **Frontend**: HTML, CSS (Design System), TypeScript
- **Backend**: Electron (Main Process), TypeScript
- **Database**: SQLite with better-sqlite3
- **Preload**: Secure context bridge
- **Build**: electron-builder for cross-platform packaging

## Project Structure

```
simple-pos-electron/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # App entry point
│   │   ├── database.ts    # SQLite manager
│   │   ├── ipc-handlers.ts
│   │   └── handlers/      # IPC handler modules
│   ├── preload/           # Secure IPC bridge
│   │   └── preload.ts
│   ├── renderer/          # UI (HTML/CSS/TS)
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.ts
│   └── shared/            # Shared types & config
│       ├── types.ts
│       └── bill-sizes.json
├── dist/                  # Compiled output
├── package.json
└── tsconfig.json
```

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Linux, macOS, or Windows

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Build the application**:
```bash
npm run build
```

3. **Run in development**:
```bash
npm run dev
```

4. **Run production**:
```bash
npm start
```

## Development

### Available Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run build` - Build TypeScript for production
- `npm run build:main` - Build main process only
- `npm run build:renderer` - Build renderer process only
- `npm start` - Run the built application
- `npm run package` - Package app for current platform
- `npm run package:win` - Package for Windows
- `npm run package:mac` - Package for macOS
- `npm run package:linux` - Package for Linux

### Database

The SQLite database is automatically created at:
- **Linux**: `~/.config/SimplePOS/pos.db`
- **macOS**: `~/Library/Application Support/SimplePOS/pos.db`
- **Windows**: `%APPDATA%/SimplePOS/pos.db`

Override with environment variable:
```bash
DB_PATH=/custom/path/pos.db npm start
```

### Default Credentials

```
Username: admin
Password: admin
```

**⚠️ Change the default password immediately after first login!**

## Usage

### Basic Workflow

1. **Login** with admin credentials
2. **Dashboard** - View sales overview and recent orders
3. **POS** - Create new orders:
   - Add custom items (name, quantity, price)
   - Assign customer (optional)
   - Finalize & print invoice
4. **History** - View all past orders and reprint
5. **Customers** - Manage customer database
6. **Templates** - Design invoice layouts (Admin only)
7. **Users** - Manage user accounts and roles (Admin only)
8. **Settings** - Configure system preferences and backups

### Creating an Order

1. Navigate to **POS** page
2. Enter item details:
   - Item name (e.g., "Coffee")
   - Quantity (e.g., 2)
   - Unit price (e.g., 50.00)
3. Click **Add** to add items to order
4. Optionally select or add customer
5. Review totals in Order Summary
6. Click **Finalize & Print**

### Installment Plans

To create an installment plan:

1. Create and finalize an order
2. Navigate to installment management
3. Set parameters:
   - Frequency (weekly/biweekly/monthly)
   - Number of installments
   - Down payment (optional)
   - Processing fee (optional)
4. System generates payment schedule
5. Record payments as they are received

### Backups

**Manual Backup**:
- Go to Settings → Backups
- Click "Create Backup Now"
- Backups saved to `userData/backups/`

**Restore**:
- Pre-restore snapshot created automatically
- Database restored from selected backup
- Application restarts to apply changes

## Data Model

### Core Tables

- `users` - User accounts with roles
- `customers` - Customer information
- `orders` - Order headers
- `order_items` - Line items per order
- `invoice_templates` - Invoice layouts
- `invoice_assets` - Logos and QR codes
- `installment_plans` - EMI plans
- `installments` - Individual payment schedules
- `payments` - Payment records
- `settings` - System configuration
- `license_state` - Licensing information

### Relationships

```
orders → user_id → users
orders → customer_id → customers
orders → invoice_template_id → invoice_templates
orders → installment_plan_id → installment_plans
order_items → order_id → orders
installments → plan_id → installment_plans
payments → installment_id → installments
```

## Configuration

### Environment Variables

```bash
# Database path
DB_PATH=/path/to/database.db

# Development mode
NODE_ENV=development

# Print debugging
PRINT_DEBUG=true

# License sandbox mode
LICENSE_SANDBOX=true
```

### Bill Sizes

Configure supported bill sizes in `src/shared/bill-sizes.json`:

```json
{
  "A4": {
    "width": 210,
    "height": 297,
    "unit": "mm",
    "safeMargins": { "top": 10, "right": 10, "bottom": 10, "left": 10 }
  }
}
```

## Architecture

### Security Model

```
Renderer Process (Untrusted)
    ↓ contextBridge
Preload Script (Validated API)
    ↓ IPC
Main Process (Trusted)
    ↓
SQLite Database
```

### IPC Communication

All renderer → main communication goes through typed IPC handlers:

```typescript
// Renderer
const user = await window.posAPI.auth.login(username, password);

// Preload (Bridge)
auth: {
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password)
}

// Main (Handler)
ipcMain.handle('auth:login', async (_, username, password) => { ... });
```

## Performance Targets

- App cold start: < 2s
- Dashboard load (5k orders): < 1s
- Thermal invoice render: < 300ms
- A4 PDF (100 items): < 1s
- Database queries: Indexed and optimized

## Roadmap

### Phase 1: ✅ Foundation (Current)
- Project setup and structure
- SQLite database with migrations
- Secure IPC architecture
- Basic authentication
- Order creation and management
- Customer management
- Simple dashboard
- PDF/print basic functionality

### Phase 2: Authentication & Users
- Enhanced user management UI
- Password change workflow
- Role-based UI permissions
- Session management

### Phase 3: Advanced POS
- Frequent order templates
- Real-time customer search
- Batch operations
- Order duplication

### Phase 4: Invoice Templates
- Visual template designer
- Logo upload and management
- Multiple QR code support
- Live preview system
- Bill size selector

### Phase 5: Multi-Session & History
- Parallel ticket system
- Order parking/unparking
- Advanced filtering
- Export functionality

### Phase 6: Installments
- EMI calculator
- Payment recording UI
- Overdue tracking
- Receipt generation

### Phase 7: Licensing
- Offline-first activation
- Subscription management
- Grace period handling
- Feature flags

### Phase 8: Polish & Testing
- Comprehensive testing
- Performance optimization
- Error handling
- Documentation

## Troubleshooting

### Database Locked
```bash
# Kill any running instances
pkill -9 electron
rm -f ~/.config/SimplePOS/*.db-wal
```

### Build Errors
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Print Issues
- Check printer connectivity
- Verify printer name in settings
- Use PDF fallback if direct print fails
- Check print permissions on Linux

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please create an issue in the repository.

---

**Powered by YourBrand** - This footer is hardcoded and cannot be disabled as per requirements.
