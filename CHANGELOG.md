# Changelog

All notable changes to SimplePOS will be documented in this file.

## [Unreleased]

### Phase 1 - Foundation (Completed)

#### Added
- Initial Electron application structure
- TypeScript configuration for main, renderer, and preload
- SQLite database with complete schema (v1 migration)
- Secure IPC architecture with context isolation
- Authentication system with bcrypt password hashing
- User management (CRUD operations)
- Customer management with GSTIN support
- Order creation and finalization workflow
- Order items management
- Invoice templates (basic structure)
- Invoice assets (logo and QR code support)
- Settings management system
- Dashboard with statistics (orders, revenue, trends)
- Print to PDF functionality
- Direct printer integration
- Backup and restore system
- File upload handlers for images
- Installment plan system (EMI)
- Installment schedule generation
- Payment recording
- Open orders (multi-session support)
- Frequent order templates
- HTML/CSS design system with CSS variables
- Responsive UI layout (header, nav, main, footer)
- Toast notification system
- Login page with authentication
- Dashboard page with KPI cards
- POS page with item entry and order summary
- History page with order listing
- Customers page
- Users page
- Settings page with backup controls
- Bill sizes configuration (A3, A4, A5, Letter, Legal, Thermal)
- Default admin user (username: admin, password: admin)
- Default invoice template
- Trial license (30 days)
- INR currency default
- Tax disabled by default
- Indian number formatting support
- Powered by YourBrand branding (hardcoded)

#### Security
- Context isolation enabled
- Node integration disabled
- Secure IPC with type validation
- Password hashing with bcrypt (10 salt rounds)
- SQL injection prevention with prepared statements
- Foreign key constraints enabled
- Role-based access control (admin, user, guest)

#### Database Schema
- `users` table with role-based access
- `customers` table with optional fields
- `orders` table with installment support
- `order_items` table for line items
- `frequent_orders` table for saved templates
- `invoice_templates` table
- `invoice_assets` table for logos/QR codes
- `open_orders` table for multi-session
- `installment_plans` table
- `installments` table with payment tracking
- `payments` table
- `settings` table (singleton)
- `license_state` table (singleton)
- Comprehensive indexes for performance

#### Developer Experience
- Hot reload in development mode
- Separate build scripts for main/renderer
- Cross-platform packaging scripts
- Environment variable support
- Comprehensive README
- Development guide
- TypeScript strict mode
- ESM module resolution

### Planned Features

#### Phase 2 - Authentication & User Management
- Enhanced user management UI
- Password change workflow
- Session timeout
- User activity logging

#### Phase 3 - Advanced POS
- Frequent order templates UI
- Real-time customer search
- Inline customer creation
- Order duplication
- Discounts

#### Phase 4 - Invoice Template Designer
- Visual template designer
- Logo upload with preview
- Multiple QR code management
- Live preview
- Bill size selection per template

#### Phase 5 - Multi-Session & History
- Multi-order session UI
- Ticket management
- Advanced filters
- Export to CSV/Excel

#### Phase 6 - Installments
- EMI calculator UI
- Payment recording interface
- Overdue tracking dashboard
- Payment receipts

#### Phase 7 - Licensing
- Online activation
- Offline grace period
- Expiry warnings
- Feature flags
- Clock rollback detection

#### Phase 8 - Polish & Testing
- Comprehensive testing
- Performance optimization
- Accessibility improvements
- Dark theme polish
- Auto-updates

## Version History

### [0.1.0] - 2025-10-12

#### Initial Development Release
- Phase 1 implementation complete
- Basic POS functionality working
- Database and IPC architecture established
- Foundation ready for Phase 2 development

---

**Note**: This is a development build. Not recommended for production use until Phase 8 is complete.
