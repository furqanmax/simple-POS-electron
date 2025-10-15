#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Check if running as root
const isRoot = process.getuid && process.getuid() === 0;

// Build electron command
const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const args = ['.'];

// Add --no-sandbox if running as root
if (isRoot) {
  console.log('⚠️  Running as root detected. Adding --no-sandbox flag.');
  console.log('⚠️  For production, avoid running as root.');
  args.push('--no-sandbox');
}

// Spawn electron process
const electron = spawn(electronPath, args, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

electron.on('close', (code) => {
  process.exit(code);
});

electron.on('error', (err) => {
  console.error('Failed to start electron:', err);
  process.exit(1);
});
