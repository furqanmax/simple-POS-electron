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

    if (currentVersion === 0) {
      this.migration_v1(db);
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
