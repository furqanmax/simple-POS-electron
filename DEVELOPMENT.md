# Development Guide - SimplePOS

## Phase-by-Phase Implementation

### Phase 1: ✅ Foundation (Completed)

**Deliverables:**
- [x] Project structure with TypeScript
- [x] Electron main/renderer/preload split
- [x] SQLite database with complete schema
- [x] Secure IPC architecture with context isolation
- [x] Migration system (v1 completed)
- [x] Basic authentication (login/logout)
- [x] User management handlers
- [x] Customer management handlers
- [x] Order creation and finalization
- [x] Invoice templates (basic structure)
- [x] Settings management
- [x] Dashboard with statistics
- [x] Print to PDF and direct print
- [x] Backup/restore system
- [x] File upload handlers
- [x] Installment plan handlers
- [x] HTML/CSS design system
- [x] Responsive UI layout
- [x] Toast notification system

**Database Schema:**
```sql
✅ users (with roles: admin, user, guest)
✅ customers (with GSTIN, address fields)
✅ orders (with installment support)
✅ order_items (line items)
✅ frequent_orders (saved templates)
✅ invoice_templates (customizable invoices)
✅ invoice_assets (logos, QR codes)
✅ open_orders (multi-session tickets)
✅ installment_plans (EMI support)
✅ installments (payment schedules)
✅ payments (transaction records)
✅ settings (system configuration)
✅ license_state (subscription tracking)
```

**Security:**
- Context isolation: ✅ Enabled
- Node integration: ✅ Disabled
- IPC validation: ✅ Type-safe handlers
- Password hashing: ✅ Bcrypt with salt rounds=10
- SQL injection prevention: ✅ Prepared statements

### Phase 2: Authentication & User Management (Next)

**Tasks:**
- [ ] Enhanced user management UI with create/edit/delete
- [ ] Password strength validation
- [ ] Password change workflow with old password verification
- [ ] User activity logging
- [ ] Session timeout configuration
- [ ] "Remember me" functionality
- [ ] User profile management
- [ ] Bulk user operations

**Files to Create:**
- `src/renderer/pages/users.ts` - User management page logic
- `src/renderer/components/user-form.ts` - User form component
- `src/renderer/components/password-change.ts` - Password modal

### Phase 3: Advanced POS Features

**Tasks:**
- [ ] Frequent order templates UI
- [ ] Quick-add from templates
- [ ] Real-time customer search with autocomplete
- [ ] Customer creation inline in POS
- [ ] Discount application (percentage/fixed)
- [ ] Order notes/comments
- [ ] Order duplication
- [ ] Void/refund workflow
- [ ] Payment method selection
- [ ] Change calculation

**Files to Create:**
- `src/renderer/pages/frequent-orders.ts`
- `src/renderer/components/customer-search.ts`
- `src/renderer/components/discount-calculator.ts`

### Phase 4: Invoice Template Designer

**Tasks:**
- [ ] Visual template designer UI
- [ ] Logo upload with preview
- [ ] Multiple QR code management
  - [ ] QR code generator integration
  - [ ] Position/size controls
  - [ ] Data/URL/payment link support
  - [ ] Error correction level selector
- [ ] Business info editor
- [ ] Typography customization
- [ ] Color scheme selection
- [ ] Live HTML preview
- [ ] PDF preview before save
- [ ] Template versioning
- [ ] Template duplication
- [ ] Bill size selector per template
- [ ] Layout variants (Classic, Minimal, Compact, Detailed)

**Files to Create:**
- `src/renderer/pages/template-designer.ts`
- `src/renderer/components/logo-uploader.ts`
- `src/renderer/components/qr-manager.ts`
- `src/renderer/components/template-preview.ts`
- `src/main/services/qr-generator.ts`

**Dependencies to Add:**
- ✅ `qrcode` - Already added

### Phase 5: Multi-Session & History

**Tasks:**
- [ ] Multi-order session UI
- [ ] Ticket tabs/cards
- [ ] Park/unpark functionality
- [ ] Auto-save on ticket switch
- [ ] Restore open tickets on startup
- [ ] Ticket limit enforcement
- [ ] Advanced order history filters
  - [ ] Date range picker
  - [ ] Customer filter
  - [ ] User filter
  - [ ] Status filter
  - [ ] Amount range
- [ ] Order detail drawer
- [ ] Export to CSV/Excel
- [ ] Batch print
- [ ] Analytics charts

**Files to Create:**
- `src/renderer/pages/multi-session.ts`
- `src/renderer/components/ticket-manager.ts`
- `src/renderer/components/date-picker.ts`
- `src/renderer/pages/history-advanced.ts`
- `src/main/services/export-service.ts`

### Phase 6: Installment System

**Tasks:**
- [ ] EMI calculator UI
- [ ] Payment schedule generation wizard
- [ ] Installment plan viewer
- [ ] Payment recording interface
- [ ] Overdue installments dashboard
- [ ] Payment receipt generation
- [ ] Partial payment support
- [ ] Early payoff calculator
- [ ] Plan cancellation workflow
- [ ] Installment history per customer
- [ ] SMS/email payment reminders (optional)

**Files to Create:**
- `src/renderer/pages/installments.ts`
- `src/renderer/components/emi-calculator.ts`
- `src/renderer/components/payment-recorder.ts`
- `src/renderer/components/installment-schedule.ts`

### Phase 7: Licensing & Subscriptions

**Tasks:**
- [ ] License activation UI
- [ ] Online verification service
- [ ] Offline grace period handling
- [ ] Expiry warnings (T-7, T-3, T-1)
- [ ] Feature flag system
- [ ] Machine fingerprinting
- [ ] Clock rollback detection
- [ ] License transfer workflow
- [ ] Subscription renewal
- [ ] Trial mode handling
- [ ] License status indicators

**Files to Create:**
- `src/main/services/license-service.ts`
- `src/main/services/fingerprint-service.ts`
- `src/renderer/pages/license-management.ts`
- `src/renderer/components/license-activation.ts`

**Security Considerations:**
- Asymmetric key verification (RSA)
- Signed license tokens (JWT-like)
- Monotonic timestamp tracking
- Secure token storage

### Phase 8: Polish, Testing & Deployment

**Tasks:**
- [ ] Comprehensive error handling
- [ ] Input validation on all forms
- [ ] Loading states and spinners
- [ ] Empty states design
- [ ] Keyboard shortcuts
- [ ] Accessibility (ARIA labels)
- [ ] Dark theme refinement
- [ ] Print layout testing (all sizes)
- [ ] Performance optimization
  - [ ] Database query optimization
  - [ ] Lazy loading for large datasets
  - [ ] Virtual scrolling for long lists
- [ ] Unit tests (main process)
- [ ] Integration tests (IPC)
- [ ] E2E tests (Playwright/Spectron)
- [ ] Build optimization
- [ ] Installer creation (NSIS, DMG, DEB)
- [ ] Code signing
- [ ] Auto-update integration
- [ ] User documentation
- [ ] API documentation

**Testing Framework:**
```bash
# Add testing dependencies
npm install --save-dev @playwright/test spectron jest @types/jest
```

## Development Workflow

### Daily Development

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Code changes:**
   - Main process: Auto-restart required (Ctrl+R in app)
   - Renderer: Reload window (Ctrl+R)
   - Preload: Requires full restart

3. **Check logs:**
   - Main process: Terminal output
   - Renderer: DevTools console (Ctrl+Shift+I)

### Database Changes

1. **Create migration:**
   - Add new migration function in `src/main/database.ts`
   - Increment `user_version` pragma
   - Test upgrade and rollback

2. **Test migration:**
   ```bash
   # Backup current database
   cp ~/.config/SimplePOS/pos.db ~/pos-backup.db
   
   # Run app with migration
   npm start
   
   # Verify schema
   sqlite3 ~/.config/SimplePOS/pos.db ".schema"
   ```

### IPC Handler Development

1. **Define types** in `src/shared/types.ts`
2. **Create handler** in `src/main/handlers/`
3. **Register handler** in `src/main/ipc-handlers.ts`
4. **Add to preload** in `src/preload/preload.ts`
5. **Use in renderer** via `window.posAPI`

### UI Development

1. **Update styles** in `src/renderer/styles.css`
2. **Add page logic** in `src/renderer/app.ts`
3. **Use design tokens** (CSS variables)
4. **Test responsiveness**

## Code Style

### TypeScript

```typescript
// Use explicit types
async function getOrders(filters: OrderFilter): Promise<OrderWithItems[]> {
  // Implementation
}

// Prefer interfaces over types for objects
interface OrderFilter {
  startDate?: string;
  endDate?: string;
}

// Use enums for constants
enum OrderStatus {
  Draft = 'draft',
  Finalized = 'finalized',
  Cancelled = 'cancelled'
}
```

### SQL

```typescript
// Always use prepared statements
db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

// Use transactions for multi-step operations
const createOrder = db.transaction((orderData, items) => {
  const orderId = insertOrder(orderData);
  items.forEach(item => insertItem(orderId, item));
  return orderId;
});
```

### HTML/CSS

```html
<!-- Use semantic HTML -->
<section class="card">
  <header class="card-header">
    <h3 class="card-title">Title</h3>
  </header>
  <div class="card-body">Content</div>
</section>

<!-- Use design tokens -->
<style>
.custom-component {
  padding: var(--space-4);
  color: var(--color-text);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}
</style>
```

## Performance Guidelines

### Database Queries

```typescript
// ✅ Good - Uses indexes
db.prepare('SELECT * FROM orders WHERE created_at >= ? ORDER BY created_at DESC').all(date);

// ❌ Bad - Full table scan
db.prepare('SELECT * FROM orders ORDER BY RANDOM()').all();

// ✅ Good - Batch operations
const insert = db.prepare('INSERT INTO items VALUES (?, ?)');
const insertMany = db.transaction((items) => {
  items.forEach(item => insert.run(item.name, item.value));
});

// ❌ Bad - N+1 queries
items.forEach(item => {
  db.prepare('INSERT INTO items VALUES (?, ?)').run(item.name, item.value);
});
```

### Renderer Performance

```typescript
// ✅ Good - Debounced search
let searchTimeout: NodeJS.Timeout;
function handleSearch(query: string) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => searchCustomers(query), 300);
}

// ❌ Bad - Search on every keystroke
input.addEventListener('input', (e) => {
  searchCustomers(e.target.value); // Too many queries
});
```

## Debugging

### Main Process

```typescript
// Add logging
console.log('Order created:', order);

// Debug IPC
ipcMain.handle('orders:create', async (event, ...args) => {
  console.log('IPC called with:', args);
  const result = await createOrder(...args);
  console.log('IPC returning:', result);
  return result;
});
```

### Renderer Process

```typescript
// DevTools console
console.log('User clicked:', button);

// Network/IPC monitoring
window.posAPI.orders.create(order, items)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### Database

```bash
# Open database in SQLite CLI
sqlite3 ~/.config/SimplePOS/pos.db

# Check schema
.schema orders

# Query data
SELECT * FROM orders LIMIT 5;

# Check indexes
.indexes

# Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM orders WHERE created_at >= date('now', '-7 days');
```

## Common Issues

### "Database is locked"
- Close all app instances
- Delete `.db-wal` and `.db-shm` files
- Restart app

### IPC handler not found
- Ensure handler is registered in `ipc-handlers.ts`
- Check handler name matches exactly
- Rebuild after changes

### Preload script errors
- Context isolation requires explicit exposure
- Cannot use Node APIs directly in renderer
- All IPC must go through preload bridge

### Print failures
- Check printer permissions (especially Linux)
- Verify printer name is correct
- Use PDF fallback
- Check Chromium print API compatibility

## Release Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Database migrations tested
- [ ] Build succeeds on all platforms
- [ ] Installers created
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Code signed (if applicable)
- [ ] Default password warning added

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
