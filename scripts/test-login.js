#!/usr/bin/env node

const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Get database path
const userDataPath = path.join(os.homedir(), '.config', 'simple-pos-electron');
const dbPath = path.join(userDataPath, 'pos.db');

console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Get admin user
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (!user) {
    console.error('❌ Admin user not found!');
    process.exit(1);
  }
  
  console.log('✓ Admin user found:', {
    id: user.id,
    username: user.username,
    role: user.role,
    active: user.active
  });
  
  // Test password verification
  const testPassword = 'admin';
  console.log('\nTesting password verification...');
  console.log('Password hash:', user.password_hash);
  
  bcrypt.compare(testPassword, user.password_hash, (err, result) => {
    if (err) {
      console.error('❌ Error comparing password:', err);
      process.exit(1);
    }
    
    if (result) {
      console.log('✓ Password verification successful!');
      console.log('\n✅ Login should work with:');
      console.log('   Username: admin');
      console.log('   Password: admin');
    } else {
      console.error('❌ Password verification failed!');
      console.log('The password hash does not match "admin"');
    }
    
    db.close();
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
