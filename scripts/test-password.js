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
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (!user) {
    console.log('❌ Admin user not found in database');
    process.exit(1);
  }
  
  console.log('✓ Admin user found');
  console.log('  ID:', user.id);
  console.log('  Username:', user.username);
  console.log('  Role:', user.role);
  console.log('  Active:', user.active);
  console.log('  Password hash:', user.password_hash);
  
  // Test password
  const testPassword = 'admin';
  console.log('\nTesting password:', testPassword);
  
  bcrypt.compare(testPassword, user.password_hash, (err, result) => {
    if (err) {
      console.error('❌ Bcrypt error:', err);
      process.exit(1);
    }
    
    if (result) {
      console.log('✓ Password matches!');
    } else {
      console.log('❌ Password does not match');
    }
    
    db.close();
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
