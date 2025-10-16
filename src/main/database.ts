import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import * as bcrypt from 'bcrypt';

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    console.log('[DB] User data path:', userDataPath);
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.dbPath = process.env.DB_PATH || path.join(userDataPath, 'pos.db');
    console.log('[DB] Database path:', this.dbPath);
  }

  initialize(): void {
    console.log('[DB] Initializing database at:', this.dbPath);
    this.db = new Database(this.dbPath);
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
    this.runMigrations();
    this.ensureSeedData();
    
    // Verify admin user after initialization
    const adminUser = this.db.prepare('SELECT id, username, role, active FROM users WHERE username = ?').get('admin');
    if (adminUser) {
      console.log('[DB] ✓ Admin user verified:', adminUser);
    } else {
      console.error('[DB] ✗ Admin user NOT FOUND after initialization!');
    }
    
    console.log('[DB] Database initialization complete');
  }

  getDB(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  private runMigrations(): void {
    const db = this.getDB();
    const currentVersion = db.pragma('user_version', { simple: true }) as number;
    console.log(`[DB] Current database version: ${currentVersion}`);

    if (currentVersion === 0) {
      this.migration_v1(db);
    }
    if (currentVersion <= 1) {
      this.migration_v2(db);
    }
    // Future migrations would go here
  }

  private migration_v1(db: Database.Database): void {
    console.log('Running migration v1...');

    db.exec(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'guest')),
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        gstin TEXT,
        address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        default_currency TEXT NOT NULL DEFAULT 'INR',
        locale TEXT NOT NULL DEFAULT 'en_IN',
        tax_enabled INTEGER NOT NULL DEFAULT 0,
        default_bill_size TEXT,
        default_bill_layout TEXT,
        per_size_margins_json TEXT,
        font_scale_override REAL,
        theme TEXT DEFAULT 'light'
      );

      -- Invoice templates
      CREATE TABLE IF NOT EXISTS invoice_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        header_json TEXT NOT NULL,
        footer_json TEXT NOT NULL,
        styles_json TEXT NOT NULL,
        preferred_bill_size TEXT,
        preferred_layout TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Invoice assets (logos, QR codes)
      CREATE TABLE IF NOT EXISTS invoice_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('logo', 'qr')),
        storage_kind TEXT NOT NULL CHECK(storage_kind IN ('file', 'blob')),
        path TEXT,
        blob BLOB,
        meta_json TEXT NOT NULL,
        FOREIGN KEY (template_id) REFERENCES invoice_templates(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_invoice_assets_template ON invoice_assets(template_id);

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        customer_id INTEGER,
        subtotal REAL NOT NULL,
        tax_rate REAL NOT NULL DEFAULT 0,
        tax_total REAL NOT NULL DEFAULT 0,
        grand_total REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft', 'finalized', 'cancelled')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        invoice_template_id INTEGER,
        invoice_snapshot_json TEXT,
        is_installment INTEGER NOT NULL DEFAULT 0,
        installment_plan_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (invoice_template_id) REFERENCES invoice_templates(id)
      );

      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

      -- Order items table
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit_price REAL NOT NULL CHECK(unit_price >= 0),
        line_total REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

      -- Frequent orders (saved templates)
      CREATE TABLE IF NOT EXISTS frequent_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER,
        label TEXT NOT NULL,
        items_json TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_frequent_orders_active ON frequent_orders(active);
      CREATE INDEX IF NOT EXISTS idx_frequent_orders_owner ON frequent_orders(owner_user_id);

      -- Open orders (multi-session tickets)
      CREATE TABLE IF NOT EXISTS open_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        customer_id INTEGER,
        state_json TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Installment plans
      CREATE TABLE IF NOT EXISTS installment_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        principal REAL NOT NULL,
        down_payment REAL NOT NULL DEFAULT 0,
        fee REAL NOT NULL DEFAULT 0,
        frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly')),
        count INTEGER NOT NULL CHECK(count > 0),
        start_date TEXT NOT NULL,
        rounding_mode TEXT NOT NULL DEFAULT 'bankers',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_installment_plans_order ON installment_plans(order_id);

      -- Installments
      CREATE TABLE IF NOT EXISTS installments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        seq_no INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        amount_due REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'paid', 'overdue')),
        paid_at TEXT,
        payment_method TEXT,
        receipt_no TEXT,
        FOREIGN KEY (plan_id) REFERENCES installment_plans(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_installments_plan_id ON installments(plan_id);
      CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
      CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);

      -- Payments
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        installment_id INTEGER,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        reference TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (installment_id) REFERENCES installments(id)
      );

      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_installment_id ON payments(installment_id);

      -- License state
      CREATE TABLE IF NOT EXISTS license_state (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        plan TEXT NOT NULL CHECK(plan IN ('Trial', 'Monthly', 'Quarterly', 'Annual')),
        expiry TEXT,
        last_verified_at TEXT,
        signed_token_blob TEXT,
        machine_fingerprint TEXT,
        last_seen_monotonic INTEGER
      );
    `);

    // Insert default settings
    db.prepare(`
      INSERT OR IGNORE INTO settings (id, default_currency, locale, tax_enabled, theme)
      VALUES (1, 'INR', 'en_IN', 0, 'light')
    `).run();

    // Insert default admin user (password: admin)
    const hashedPassword = bcrypt.hashSync('admin', 10);
    db.prepare(`
      INSERT OR IGNORE INTO users (username, password_hash, role, active)
      VALUES ('admin', ?, 'admin', 1)
    `).run(hashedPassword);

    // Insert default invoice template
    const defaultTemplate = {
      businessName: 'Your Business Name',
      businessAddress: 'Your Address',
      businessPhone: '',
      businessEmail: '',
      businessTaxId: '',
      showLogo: true,
      showQR: false,
      footerText: 'Thank you for your business!'
    };

    db.prepare(`
      INSERT OR IGNORE INTO invoice_templates (name, is_default, header_json, footer_json, styles_json, preferred_bill_size, preferred_layout)
      VALUES ('Default', 1, ?, ?, ?, 'A4', 'Classic')
    `).run(
      JSON.stringify(defaultTemplate),
      JSON.stringify({ text: 'Powered by YourBrand' }),
      JSON.stringify({ fontSize: 12, fontFamily: 'Arial' })
    );

    // Insert trial license
    db.prepare(`
      INSERT OR IGNORE INTO license_state (id, plan, expiry, last_seen_monotonic)
      VALUES (1, 'Trial', datetime('now', '+30 days'), 0)
    `).run();

    db.pragma('user_version = 1');
    console.log('Migration v1 completed');
  }

  private migration_v2(db: Database.Database): void {
    console.log('Running migration v2 - Adding roles and permissions...');
    
    // Check if migration has already been run
    const rolesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='roles'").get() as any;
    if (rolesTable) {
      console.log('Migration v2 already applied, skipping...');
      db.pragma('user_version = 2');
      return;
    }

    db.exec(`
      -- Roles table (replacing the basic role field)
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

      -- Permissions table
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(resource, action)
      );

      CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
      CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

      -- Role permissions junction table
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      );

      CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

      -- User roles junction table (for future multiple roles per user)
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
        assigned_by INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        UNIQUE(user_id, role_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

      -- Permission overrides (user-specific permissions)
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        granted INTEGER NOT NULL DEFAULT 1, -- 1 for grant, 0 for revoke
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(user_id, permission_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);

      -- Audit log for permission changes
      CREATE TABLE IF NOT EXISTS permission_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL, -- 'role', 'user', 'permission'
        target_id INTEGER NOT NULL,
        details_json TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_permission_audit_log_user ON permission_audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created ON permission_audit_log(created_at);
    `);

    // Insert default roles
    db.prepare(`
      INSERT OR IGNORE INTO roles (name, description, is_system)
      VALUES 
        ('admin', 'Administrator with full access', 1),
        ('user', 'Standard user with limited access', 1),
        ('manager', 'Manager with elevated permissions', 0),
        ('cashier', 'Cashier with POS access only', 0),
        ('viewer', 'Read-only access', 0)
    `).run();

    // Define all permissions
    const permissions = [
      // User management
      { resource: 'users', action: 'create', description: 'Create new users' },
      { resource: 'users', action: 'read', description: 'View users' },
      { resource: 'users', action: 'update', description: 'Update user information' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      { resource: 'users', action: 'manage_roles', description: 'Assign/remove user roles' },
      
      // Role management
      { resource: 'roles', action: 'create', description: 'Create new roles' },
      { resource: 'roles', action: 'read', description: 'View roles' },
      { resource: 'roles', action: 'update', description: 'Update role information' },
      { resource: 'roles', action: 'delete', description: 'Delete roles' },
      { resource: 'roles', action: 'manage_permissions', description: 'Assign/remove role permissions' },
      
      // Customer management
      { resource: 'customers', action: 'create', description: 'Create new customers' },
      { resource: 'customers', action: 'read', description: 'View customers' },
      { resource: 'customers', action: 'update', description: 'Update customer information' },
      { resource: 'customers', action: 'delete', description: 'Delete customers' },
      { resource: 'customers', action: 'export', description: 'Export customer data' },
      
      // Order management
      { resource: 'orders', action: 'create', description: 'Create new orders' },
      { resource: 'orders', action: 'read', description: 'View orders' },
      { resource: 'orders', action: 'update', description: 'Update orders' },
      { resource: 'orders', action: 'delete', description: 'Delete orders' },
      { resource: 'orders', action: 'cancel', description: 'Cancel orders' },
      { resource: 'orders', action: 'finalize', description: 'Finalize orders' },
      { resource: 'orders', action: 'refund', description: 'Process refunds' },
      { resource: 'orders', action: 'view_all', description: 'View all users orders' },
      
      // Payment management
      { resource: 'payments', action: 'create', description: 'Process payments' },
      { resource: 'payments', action: 'read', description: 'View payments' },
      { resource: 'payments', action: 'update', description: 'Update payment information' },
      { resource: 'payments', action: 'delete', description: 'Delete payment records' },
      { resource: 'payments', action: 'refund', description: 'Process payment refunds' },
      
      // Installment management
      { resource: 'installments', action: 'create', description: 'Create installment plans' },
      { resource: 'installments', action: 'read', description: 'View installment plans' },
      { resource: 'installments', action: 'update', description: 'Update installment plans' },
      { resource: 'installments', action: 'delete', description: 'Delete installment plans' },
      { resource: 'installments', action: 'process_payment', description: 'Process installment payments' },
      
      // Template management
      { resource: 'templates', action: 'create', description: 'Create invoice templates' },
      { resource: 'templates', action: 'read', description: 'View templates' },
      { resource: 'templates', action: 'update', description: 'Update templates' },
      { resource: 'templates', action: 'delete', description: 'Delete templates' },
      
      // Settings management
      { resource: 'settings', action: 'read', description: 'View settings' },
      { resource: 'settings', action: 'update', description: 'Update settings' },
      { resource: 'settings', action: 'manage_license', description: 'Manage license' },
      
      // Reports and analytics
      { resource: 'reports', action: 'view_sales', description: 'View sales reports' },
      { resource: 'reports', action: 'view_inventory', description: 'View inventory reports' },
      { resource: 'reports', action: 'view_financial', description: 'View financial reports' },
      { resource: 'reports', action: 'export', description: 'Export reports' },
      
      // Backup and restore
      { resource: 'backup', action: 'create', description: 'Create backups' },
      { resource: 'backup', action: 'restore', description: 'Restore from backup' },
      { resource: 'backup', action: 'download', description: 'Download backups' },
      
      // Dashboard
      { resource: 'dashboard', action: 'view', description: 'View dashboard' },
      { resource: 'dashboard', action: 'view_all_stats', description: 'View all statistics' }
    ];

    // Insert all permissions
    const insertPermission = db.prepare(`
      INSERT OR IGNORE INTO permissions (resource, action, description)
      VALUES (?, ?, ?)
    `);

    for (const perm of permissions) {
      insertPermission.run(perm.resource, perm.action, perm.description);
    }

    // Get role IDs
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin') as any;
    const userRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('user') as any;
    const managerRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('manager') as any;
    const cashierRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('cashier') as any;
    const viewerRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('viewer') as any;

    // Admin gets all permissions
    const allPermissions = db.prepare('SELECT id FROM permissions').all() as any[];
    const insertRolePermission = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
    `);

    for (const perm of allPermissions) {
      insertRolePermission.run(adminRole.id, perm.id);
    }

    // User role permissions (basic user)
    const userPermissions = [
      'orders:create', 'orders:read', 'orders:update',
      'customers:create', 'customers:read', 'customers:update',
      'payments:create', 'payments:read',
      'templates:read',
      'settings:read',
      'dashboard:view'
    ];

    for (const permString of userPermissions) {
      const [resource, action] = permString.split(':');
      const perm = db.prepare('SELECT id FROM permissions WHERE resource = ? AND action = ?').get(resource, action) as any;
      if (perm) {
        insertRolePermission.run(userRole.id, perm.id);
      }
    }

    // Manager role permissions
    const managerPermissions = [
      'orders:*', 'customers:*', 'payments:*', 'installments:*',
      'templates:*', 'reports:*', 'dashboard:*', 'backup:create',
      'users:read', 'users:update'
    ];

    for (const permString of managerPermissions) {
      if (permString.includes('*')) {
        const resource = permString.split(':')[0];
        const resourcePerms = db.prepare('SELECT id FROM permissions WHERE resource = ?').all(resource) as any[];
        for (const perm of resourcePerms) {
          insertRolePermission.run(managerRole.id, perm.id);
        }
      } else {
        const [resource, action] = permString.split(':');
        const perm = db.prepare('SELECT id FROM permissions WHERE resource = ? AND action = ?').get(resource, action) as any;
        if (perm) {
          insertRolePermission.run(managerRole.id, perm.id);
        }
      }
    }

    // Cashier role permissions
    const cashierPermissions = [
      'orders:create', 'orders:read', 'orders:finalize',
      'customers:create', 'customers:read',
      'payments:create', 'payments:read',
      'dashboard:view'
    ];

    for (const permString of cashierPermissions) {
      const [resource, action] = permString.split(':');
      const perm = db.prepare('SELECT id FROM permissions WHERE resource = ? AND action = ?').get(resource, action) as any;
      if (perm) {
        insertRolePermission.run(cashierRole.id, perm.id);
      }
    }

    // Viewer role permissions (read-only)
    const viewerPermissions = db.prepare('SELECT id FROM permissions WHERE action = ?').all('read') as any[];
    for (const perm of viewerPermissions) {
      insertRolePermission.run(viewerRole.id, perm.id);
    }
    // Also add view permissions
    const viewPermissions = db.prepare('SELECT id FROM permissions WHERE action LIKE ?').all('view%') as any[];
    for (const perm of viewPermissions) {
      insertRolePermission.run(viewerRole.id, perm.id);
    }

    // Migrate existing users to use the new role system
    try {
      const users = db.prepare('SELECT id, role FROM users').all() as any[];
      const insertUserRole = db.prepare(`
        INSERT OR IGNORE INTO user_roles (user_id, role_id)
        VALUES (?, ?)
      `);

      for (const user of users) {
        let roleId;
        switch (user.role) {
          case 'admin':
            roleId = adminRole.id;
            break;
          case 'user':
            roleId = userRole.id;
            break;
          case 'guest':
            roleId = viewerRole.id;
            break;
          default:
            roleId = userRole.id;
        }
        if (roleId) {
          insertUserRole.run(user.id, roleId);
        }
      }
    } catch (e) {
      console.log('Note: Could not migrate existing users (might be fresh install):', e);
    }

    db.pragma('user_version = 2');
    console.log('Migration v2 completed - Roles and permissions system added');
  }

  private ensureSeedData(): void {
    const db = this.getDB();
    console.log('[DB] Ensuring seed data...');
    try {
      // Ensure default admin user exists if users table exists and is empty
      const usersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get() as any;
      if (usersTable) {
        const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
        console.log('[DB] Users count:', row?.count || 0);
        if (!row || row.count === 0) {
          console.log('[DB] Creating default admin user...');
          const hashedPassword = bcrypt.hashSync('admin', 10);
          db.prepare(`
            INSERT OR IGNORE INTO users (username, password_hash, role, active)
            VALUES ('admin', ?, 'admin', 1)
          `).run(hashedPassword);
          console.log('[DB] ✓ Admin user created');
        } else {
          console.log('[DB] Users already exist, skipping admin creation');
        }
      }

      // Ensure settings row exists
      const settingsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get() as any;
      if (settingsTable) {
        const s = db.prepare('SELECT 1 FROM settings WHERE id = 1').get() as any;
        if (!s) {
          db.prepare(`
            INSERT OR IGNORE INTO settings (id, default_currency, locale, tax_enabled, theme)
            VALUES (1, 'INR', 'en_IN', 0, 'light')
          `).run();
        }
      }

      // Ensure at least one invoice template exists and default is set
      const templatesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_templates'").get() as any;
      if (templatesTable) {
        const tcount = db.prepare('SELECT COUNT(*) as count FROM invoice_templates').get() as any;
        if (!tcount || tcount.count === 0) {
          const defaultTemplate = {
            businessName: 'Your Business Name',
            businessAddress: 'Your Address',
            businessPhone: '',
            businessEmail: '',
            businessTaxId: '',
            showLogo: true,
            showQR: false,
            footerText: 'Thank you for your business!'
          };
          db.prepare(`
            INSERT INTO invoice_templates (name, is_default, header_json, footer_json, styles_json, preferred_bill_size, preferred_layout)
            VALUES ('Default', 1, ?, ?, ?, 'A4', 'Classic')
          `).run(
            JSON.stringify(defaultTemplate),
            JSON.stringify({ text: 'Powered by YourBrand' }),
            JSON.stringify({ fontSize: 12, fontFamily: 'Arial' })
          );
        } else {
          const def = db.prepare('SELECT 1 FROM invoice_templates WHERE is_default = 1').get() as any;
          if (!def) {
            const first = db.prepare('SELECT id FROM invoice_templates ORDER BY id LIMIT 1').get() as any;
            if (first) {
              db.prepare('UPDATE invoice_templates SET is_default = 1 WHERE id = ?').run(first.id);
            }
          }
        }
      }

      // Ensure license row exists
      const licenseTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='license_state'").get() as any;
      if (licenseTable) {
        const l = db.prepare('SELECT 1 FROM license_state WHERE id = 1').get() as any;
        if (!l) {
          db.prepare(`
            INSERT OR IGNORE INTO license_state (id, plan, expiry, last_seen_monotonic)
            VALUES (1, 'Trial', datetime('now', '+30 days'), 0)
          `).run();
        }
      }
    } catch (e) {
      // Non-fatal: seeding should not crash app
      console.warn('ensureSeedData warning:', e);
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  backup(destination: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    this.db.backup(destination);
  }

  vacuum(): void {
    this.getDB().exec('VACUUM');
  }

  analyze(): void {
    this.getDB().exec('ANALYZE');
  }
}

export const dbManager = new DatabaseManager();
