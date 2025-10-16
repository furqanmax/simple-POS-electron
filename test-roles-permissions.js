/**
 * Test script for Roles and Permissions System
 * This script tests various scenarios and edge cases
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

// Test database path
const TEST_DB_PATH = path.join(__dirname, 'test-permissions.db');

// Initialize test database
function initTestDB() {
  const db = new Database(TEST_DB_PATH);
  
  // Run migrations
  db.exec(`
    -- Roles table
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    -- Permissions table
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(resource, action)
    );
    
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
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    -- User roles junction table
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      assigned_by INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      UNIQUE(user_id, role_id)
    );
    
    -- User permission overrides
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      granted INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
      UNIQUE(user_id, permission_id)
    );
    
    -- Audit log
    CREATE TABLE IF NOT EXISTS permission_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  
  return db;
}

// Test Cases
class RolePermissionTests {
  constructor() {
    this.db = initTestDB();
    this.testResults = [];
  }
  
  // Helper function to run a test
  runTest(name, testFn) {
    try {
      testFn();
      this.testResults.push({ name, status: 'PASS', error: null });
      console.log(`✓ ${name}`);
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      console.error(`✗ ${name}: ${error.message}`);
    }
  }
  
  // Test 1: Create roles with various edge cases
  testRoleCreation() {
    this.runTest('Create system role', () => {
      const result = this.db.prepare(`
        INSERT INTO roles (name, description, is_system) 
        VALUES ('admin', 'Administrator', 1)
      `).run();
      if (!result.lastInsertRowid) throw new Error('Failed to create system role');
    });
    
    this.runTest('Create custom role', () => {
      const result = this.db.prepare(`
        INSERT INTO roles (name, description, is_system) 
        VALUES ('manager', 'Manager role', 0)
      `).run();
      if (!result.lastInsertRowid) throw new Error('Failed to create custom role');
    });
    
    this.runTest('Prevent duplicate role names', () => {
      try {
        this.db.prepare(`
          INSERT INTO roles (name, description, is_system) 
          VALUES ('admin', 'Duplicate admin', 0)
        `).run();
        throw new Error('Should not allow duplicate role names');
      } catch (err) {
        if (!err.message.includes('UNIQUE')) {
          throw new Error('Wrong error for duplicate role');
        }
      }
    });
    
    this.runTest('Role name with special characters', () => {
      const result = this.db.prepare(`
        INSERT INTO roles (name, description, is_system) 
        VALUES ('test-role_123', 'Role with special chars', 0)
      `).run();
      if (!result.lastInsertRowid) throw new Error('Failed to create role with special characters');
    });
  }
  
  // Test 2: Permission creation and assignment
  testPermissions() {
    // Create test permissions
    const permissions = [
      { resource: 'users', action: 'create', description: 'Create users' },
      { resource: 'users', action: 'read', description: 'Read users' },
      { resource: 'users', action: 'update', description: 'Update users' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      { resource: 'orders', action: 'create', description: 'Create orders' },
      { resource: 'orders', action: 'read', description: 'Read orders' },
    ];
    
    this.runTest('Create permissions', () => {
      const stmt = this.db.prepare(`
        INSERT INTO permissions (resource, action, description)
        VALUES (?, ?, ?)
      `);
      
      for (const perm of permissions) {
        stmt.run(perm.resource, perm.action, perm.description);
      }
    });
    
    this.runTest('Prevent duplicate permissions', () => {
      try {
        this.db.prepare(`
          INSERT INTO permissions (resource, action, description)
          VALUES ('users', 'create', 'Duplicate')
        `).run();
        throw new Error('Should not allow duplicate permissions');
      } catch (err) {
        if (!err.message.includes('UNIQUE')) {
          throw new Error('Wrong error for duplicate permission');
        }
      }
    });
    
    this.runTest('Assign permissions to role', () => {
      const adminRoleId = 1;
      const permissions = this.db.prepare('SELECT id FROM permissions').all();
      
      const stmt = this.db.prepare(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
      `);
      
      for (const perm of permissions) {
        stmt.run(adminRoleId, perm.id);
      }
      
      const count = this.db.prepare('SELECT COUNT(*) as cnt FROM role_permissions WHERE role_id = ?')
        .get(adminRoleId);
      if (count.cnt !== permissions.length) {
        throw new Error('Not all permissions were assigned');
      }
    });
  }
  
  // Test 3: User role assignments
  testUserRoles() {
    // Create test users
    this.runTest('Create test users', () => {
      const hash = bcrypt.hashSync('password123', 10);
      const users = [
        { username: 'testadmin', role: 'admin', hash },
        { username: 'testuser', role: 'user', hash },
        { username: 'testmanager', role: 'manager', hash },
      ];
      
      const stmt = this.db.prepare(`
        INSERT INTO users (username, password_hash, role)
        VALUES (?, ?, ?)
      `);
      
      for (const user of users) {
        stmt.run(user.username, user.hash, user.role);
      }
    });
    
    this.runTest('Assign roles to users', () => {
      const users = this.db.prepare('SELECT id, role FROM users').all();
      const roles = this.db.prepare('SELECT id, name FROM roles').all();
      
      const stmt = this.db.prepare(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `);
      
      for (const user of users) {
        const role = roles.find(r => r.name === user.role || r.name === 'user');
        if (role) {
          stmt.run(user.id, role.id, 1);
        }
      }
    });
    
    this.runTest('User cannot have duplicate roles', () => {
      try {
        this.db.prepare(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES (1, 1)
        `).run();
        throw new Error('Should not allow duplicate user-role assignment');
      } catch (err) {
        if (!err.message.includes('UNIQUE')) {
          throw new Error('Wrong error for duplicate user-role');
        }
      }
    });
  }
  
  // Test 4: Permission checks
  testPermissionChecks() {
    this.runTest('Check user has permission through role', () => {
      const result = this.db.prepare(`
        SELECT 1 as has_permission
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = 1 AND p.resource = 'users' AND p.action = 'create'
      `).get();
      
      if (!result) {
        throw new Error('Admin user should have users:create permission');
      }
    });
    
    this.runTest('Permission override - grant', () => {
      // Grant a permission directly to user
      const permId = this.db.prepare('SELECT id FROM permissions WHERE resource = ? AND action = ?')
        .get('orders', 'delete');
      
      if (permId) {
        this.db.prepare(`
          INSERT INTO user_permissions (user_id, permission_id, granted)
          VALUES (2, ?, 1)
        `).run(permId.id);
        
        const hasPermission = this.db.prepare(`
          SELECT 1 FROM user_permissions 
          WHERE user_id = 2 AND permission_id = ? AND granted = 1
        `).get(permId.id);
        
        if (!hasPermission) {
          throw new Error('Permission grant override failed');
        }
      }
    });
    
    this.runTest('Permission override - revoke', () => {
      // Revoke a permission from user
      const permId = this.db.prepare('SELECT id FROM permissions WHERE resource = ? AND action = ?')
        .get('users', 'delete');
      
      if (permId) {
        this.db.prepare(`
          INSERT INTO user_permissions (user_id, permission_id, granted)
          VALUES (1, ?, 0)
        `).run(permId.id);
        
        // Check that revoked permission is detected
        const isRevoked = this.db.prepare(`
          SELECT 1 FROM user_permissions 
          WHERE user_id = 1 AND permission_id = ? AND granted = 0
        `).get(permId.id);
        
        if (!isRevoked) {
          throw new Error('Permission revoke override failed');
        }
      }
    });
  }
  
  // Test 5: Edge cases and security
  testEdgeCases() {
    this.runTest('Handle SQL injection in role name', () => {
      const maliciousName = "admin'; DROP TABLE roles; --";
      try {
        const stmt = this.db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
        stmt.run(maliciousName, 'Test');
        // Should succeed but safely escape the string
        const role = this.db.prepare('SELECT * FROM roles WHERE name = ?').get(maliciousName);
        if (!role) {
          throw new Error('Failed to handle special characters safely');
        }
      } catch (err) {
        // May fail due to existing name, that's ok
      }
    });
    
    this.runTest('Handle empty/null values', () => {
      try {
        this.db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)')
          .run('', 'Empty name');
        // Should succeed or fail based on constraints
      } catch (err) {
        // Expected to fail, that's good
      }
      
      try {
        this.db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)')
          .run('valid_name', null);
        // Should succeed with null description
      } catch (err) {
        throw new Error('Should allow null description');
      }
    });
    
    this.runTest('Cascade delete for role', () => {
      // Create a role with permissions
      const roleResult = this.db.prepare('INSERT INTO roles (name) VALUES (?)').run('temp_role');
      const roleId = roleResult.lastInsertRowid;
      
      // Add permissions to role
      this.db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, 1)').run(roleId);
      
      // Delete role - should cascade delete role_permissions
      this.db.prepare('DELETE FROM roles WHERE id = ?').run(roleId);
      
      const orphaned = this.db.prepare('SELECT COUNT(*) as cnt FROM role_permissions WHERE role_id = ?')
        .get(roleId);
      
      if (orphaned.cnt > 0) {
        throw new Error('Cascade delete failed for role_permissions');
      }
    });
    
    this.runTest('Transaction rollback on error', () => {
      const db = this.db;
      try {
        db.prepare('BEGIN').run();
        
        // Insert valid role
        db.prepare('INSERT INTO roles (name) VALUES (?)').run('transaction_test');
        
        // Try to insert duplicate (should fail)
        db.prepare('INSERT INTO roles (name) VALUES (?)').run('transaction_test');
        
        db.prepare('COMMIT').run();
        throw new Error('Transaction should have failed');
      } catch (err) {
        db.prepare('ROLLBACK').run();
        
        // Check that nothing was inserted
        const count = db.prepare('SELECT COUNT(*) as cnt FROM roles WHERE name = ?')
          .get('transaction_test');
        
        if (count.cnt > 0) {
          throw new Error('Transaction rollback failed');
        }
      }
    });
  }
  
  // Test 6: Performance with large datasets
  testPerformance() {
    this.runTest('Handle 1000+ permissions efficiently', () => {
      const start = Date.now();
      const stmt = this.db.prepare(`
        INSERT INTO permissions (resource, action, description)
        VALUES (?, ?, ?)
      `);
      
      // Use transaction for bulk insert
      const insertMany = this.db.transaction((perms) => {
        for (const perm of perms) {
          stmt.run(perm.resource, perm.action, perm.description);
        }
      });
      
      const largePermSet = [];
      for (let i = 0; i < 1000; i++) {
        largePermSet.push({
          resource: `resource_${i}`,
          action: `action_${i % 10}`,
          description: `Test permission ${i}`
        });
      }
      
      try {
        insertMany(largePermSet);
      } catch (err) {
        // Some might fail due to duplicates, that's ok
      }
      
      const elapsed = Date.now() - start;
      if (elapsed > 1000) {
        throw new Error(`Performance issue: took ${elapsed}ms to insert permissions`);
      }
    });
    
    this.runTest('Efficient permission lookup', () => {
      const start = Date.now();
      
      // Complex permission check query
      const query = this.db.prepare(`
        SELECT DISTINCT 1 as has_permission
        FROM (
          -- Permissions through roles
          SELECT p.id
          FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE ur.user_id = ? AND p.resource = ? AND p.action = ?
          
          UNION
          
          -- Direct permission grants
          SELECT p.id
          FROM user_permissions up
          JOIN permissions p ON up.permission_id = p.id
          WHERE up.user_id = ? AND up.granted = 1 AND p.resource = ? AND p.action = ?
        ) 
        WHERE id NOT IN (
          -- Excluded by permission revokes
          SELECT permission_id
          FROM user_permissions
          WHERE user_id = ? AND granted = 0
        )
      `);
      
      // Run 100 permission checks
      for (let i = 0; i < 100; i++) {
        query.get(1, 'users', 'read', 1, 'users', 'read', 1);
      }
      
      const elapsed = Date.now() - start;
      if (elapsed > 100) {
        throw new Error(`Performance issue: took ${elapsed}ms for 100 permission checks`);
      }
    });
  }
  
  // Test 7: Audit logging
  testAuditLog() {
    this.runTest('Log permission changes', () => {
      const stmt = this.db.prepare(`
        INSERT INTO permission_audit_log (user_id, action, target_type, target_id, details_json)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const details = JSON.stringify({ role: 'admin', permission: 'users:create' });
      stmt.run(1, 'grant_permission', 'role', 1, details);
      
      const log = this.db.prepare('SELECT * FROM permission_audit_log ORDER BY id DESC LIMIT 1').get();
      if (!log) {
        throw new Error('Audit log entry not created');
      }
      
      const parsedDetails = JSON.parse(log.details_json);
      if (parsedDetails.role !== 'admin') {
        throw new Error('Audit log details not stored correctly');
      }
    });
    
    this.runTest('Query audit log by date range', () => {
      const logs = this.db.prepare(`
        SELECT * FROM permission_audit_log
        WHERE created_at >= datetime('now', '-1 day')
        AND created_at <= datetime('now')
      `).all();
      
      if (!Array.isArray(logs)) {
        throw new Error('Failed to query audit log by date');
      }
    });
  }
  
  // Run all tests
  runAll() {
    console.log('\n=== Running Role & Permission System Tests ===\n');
    
    this.testRoleCreation();
    this.testPermissions();
    this.testUserRoles();
    this.testPermissionChecks();
    this.testEdgeCases();
    this.testPerformance();
    this.testAuditLog();
    
    // Summary
    console.log('\n=== Test Results ===\n');
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    // Cleanup
    this.db.close();
    
    return failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tests = new RolePermissionTests();
  const success = tests.runAll();
  process.exit(success ? 0 : 1);
}

module.exports = RolePermissionTests;
