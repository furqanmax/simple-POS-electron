#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get database path
const userDataPath = path.join(os.homedir(), '.config', 'simple-pos-electron');
const dbPath = path.join(userDataPath, 'pos.db');

console.log('Database path:', dbPath);

if (fs.existsSync(dbPath)) {
  console.log('Removing existing database...');
  fs.unlinkSync(dbPath);
  console.log('✓ Database removed');
} else {
  console.log('No existing database found');
}

console.log('\n✓ Database reset complete');
console.log('Run "npm start" to create a fresh database with default admin user');
console.log('Login with: username="admin", password="admin"');
