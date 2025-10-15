#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcRenderer = path.join(root, 'src', 'renderer');
const distRenderer = path.join(root, 'dist', 'renderer');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log('Copied', src, '->', dest);
}

function main() {
  ensureDir(distRenderer);
  // Copy static assets (HTML/CSS)
  ['index.html', 'styles.css'].forEach(file => {
    const src = path.join(srcRenderer, file);
    const dest = path.join(distRenderer, file);
    if (fs.existsSync(src)) copyFile(src, dest);
  });
}

main();
