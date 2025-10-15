# Quick Test Guide for SimplePOS Electron

## Build & Run Instructions

### Option 1: Clean Build (Recommended)
```bash
# If you encounter permission issues, try:
sudo rm -rf dist node_modules
npm install
npm run build
npm start
```

### Option 2: Development Mode
```bash
# This will watch for changes and rebuild automatically
npm run dev
```

## Testing Checklist

### 1. Authentication ✓
- [ ] Login with admin/admin
- [ ] Logout functionality
- [ ] Session persistence

### 2. POS Operations ✓
- [ ] Add custom items
- [ ] Calculate totals correctly
- [ ] Save frequent orders
- [ ] Apply frequent orders
- [ ] Customer selection
- [ ] Finalize order
- [ ] Print/PDF generation

### 3. Template Management ✓
- [ ] Create new template
- [ ] Edit business information
- [ ] Upload logo
- [ ] Add QR codes (multiple)
- [ ] Set default template
- [ ] Preview template

### 4. User Management (Admin) ✓
- [ ] Create new users
- [ ] Assign roles (Admin/User/Guest)
- [ ] Activate/Deactivate users
- [ ] Delete users

### 5. Printing ✓
- [ ] Generate PDF for different sizes:
  - [ ] A4 (default)
  - [ ] Thermal 80mm
  - [ ] Letter size
- [ ] Direct print to system printer
- [ ] PDF fallback on print failure

### 6. Data Management ✓
- [ ] Create backup
- [ ] View order history
- [ ] Customer management
- [ ] Settings update

### 7. Installments
- [ ] View overdue installments
- [ ] Record payments
- [ ] View active plans

## Test Scenarios

### Scenario 1: Complete Order Flow
1. Login as admin
2. Navigate to POS
3. Add 3 items with different quantities
4. Select/create a customer
5. Finalize order
6. Print invoice (try both PDF and direct print)

### Scenario 2: Template Customization
1. Go to Templates
2. Create new template "Custom Invoice"
3. Add business details
4. Upload a logo (any image file)
5. Add 2 QR codes:
   - Payment link QR
   - Contact info QR
6. Set as default
7. Create a new order and verify template is used

### Scenario 3: Multi-User Test
1. Create a new user with "user" role
2. Logout and login as the new user
3. Verify restricted access (no Users, Templates, Settings)
4. Create an order as regular user
5. Switch back to admin
6. View the order in History

### Scenario 4: Thermal Printing
1. Edit a template
2. Set preferred size to "Thermal80"
3. Set layout to "Compact"
4. Create and finalize an order
5. Generate PDF - verify thermal-optimized layout

## Common Issues & Solutions

### Permission Denied Errors
```bash
# Fix with:
sudo chown -R $(whoami) dist/
# or
sudo rm -rf dist && mkdir dist
```

### Database Not Found
```bash
# Reset database:
rm -rf ~/Library/Application\ Support/simple-pos-electron/pos.db  # macOS
rm -rf ~/.config/simple-pos-electron/pos.db  # Linux
```

### Build Errors
```bash
# Clean install:
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Quick Data Entry

### Sample Items for Testing
```
Item: Coffee, Qty: 2, Price: 50
Item: Sandwich, Qty: 1, Price: 120
Item: Juice, Qty: 3, Price: 40
Item: Pastry, Qty: 2, Price: 80
```

### Sample Customer
```
Name: John Doe
Phone: +91 9876543210
Email: john@example.com
GSTIN: 29ABCDE1234F1Z5
Address: 123 Main St, City
```

### Sample QR Data
```
QR 1 - Payment:
Label: "Pay with UPI"
Data: "upi://pay?pa=business@upi&pn=YourBusiness&am=AMOUNT"

QR 2 - Contact:
Label: "Contact Us"
Data: "tel:+919876543210"
```

## Performance Benchmarks

Expected performance on modern hardware:

- App cold start: < 2 seconds
- Dashboard load: < 1 second with 5000 orders
- Thermal print render: < 300ms
- A4 PDF generation (100 items): < 1 second
- Order finalization: < 500ms

## Debug Mode

For troubleshooting, the app opens DevTools by default. Check the console for:
- Database initialization logs
- IPC handler registration
- Authentication flow
- Print generation steps

## Success Criteria

The application is considered working if:
1. ✅ Users can login and navigate all allowed sections
2. ✅ Orders can be created, finalized, and printed
3. ✅ Templates with logos and QR codes work
4. ✅ Multiple bill sizes generate correctly
5. ✅ Role-based access control is enforced
6. ✅ Data persistence works across restarts
7. ✅ "Powered by YourBrand" appears on all invoices
