#!/usr/bin/env node

/**
 * Setup Validation Script
 * Checks if the development environment is properly configured
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, 'red');
    return false;
  }
}

function main() {
  log('\n=== SimplePOS Setup Validation ===\n', 'blue');
  
  let allChecks = true;
  
  // Check project structure
  log('Checking project structure...', 'yellow');
  allChecks &= checkDirectory('src', 'src/ directory');
  allChecks &= checkDirectory('src/main', 'src/main/ directory');
  allChecks &= checkDirectory('src/preload', 'src/preload/ directory');
  allChecks &= checkDirectory('src/renderer', 'src/renderer/ directory');
  allChecks &= checkDirectory('src/shared', 'src/shared/ directory');
  allChecks &= checkDirectory('src/main/handlers', 'src/main/handlers/ directory');
  
  log('\nChecking main process files...', 'yellow');
  allChecks &= checkFile('src/main/main.ts', 'Main process entry');
  allChecks &= checkFile('src/main/database.ts', 'Database manager');
  allChecks &= checkFile('src/main/ipc-handlers.ts', 'IPC handler registry');
  
  log('\nChecking handler files...', 'yellow');
  allChecks &= checkFile('src/main/handlers/auth-handlers.ts', 'Auth handlers');
  allChecks &= checkFile('src/main/handlers/user-handlers.ts', 'User handlers');
  allChecks &= checkFile('src/main/handlers/customer-handlers.ts', 'Customer handlers');
  allChecks &= checkFile('src/main/handlers/order-handlers.ts', 'Order handlers');
  allChecks &= checkFile('src/main/handlers/template-handlers.ts', 'Template handlers');
  allChecks &= checkFile('src/main/handlers/settings-handlers.ts', 'Settings handlers');
  allChecks &= checkFile('src/main/handlers/print-handlers.ts', 'Print handlers');
  allChecks &= checkFile('src/main/handlers/backup-handlers.ts', 'Backup handlers');
  allChecks &= checkFile('src/main/handlers/file-handlers.ts', 'File handlers');
  allChecks &= checkFile('src/main/handlers/dashboard-handlers.ts', 'Dashboard handlers');
  allChecks &= checkFile('src/main/handlers/installment-handlers.ts', 'Installment handlers');
  
  log('\nChecking preload files...', 'yellow');
  allChecks &= checkFile('src/preload/preload.ts', 'Preload script');
  
  log('\nChecking renderer files...', 'yellow');
  allChecks &= checkFile('src/renderer/index.html', 'Main HTML');
  allChecks &= checkFile('src/renderer/styles.css', 'Styles');
  allChecks &= checkFile('src/renderer/app.ts', 'Application logic');
  
  log('\nChecking shared files...', 'yellow');
  allChecks &= checkFile('src/shared/types.ts', 'TypeScript types');
  allChecks &= checkFile('src/shared/bill-sizes.json', 'Bill sizes config');
  
  log('\nChecking configuration files...', 'yellow');
  allChecks &= checkFile('package.json', 'package.json');
  allChecks &= checkFile('tsconfig.json', 'tsconfig.json');
  allChecks &= checkFile('tsconfig.main.json', 'tsconfig.main.json');
  allChecks &= checkFile('tsconfig.renderer.json', 'tsconfig.renderer.json');
  
  log('\nChecking documentation...', 'yellow');
  allChecks &= checkFile('README.md', 'README.md');
  allChecks &= checkFile('DEVELOPMENT.md', 'DEVELOPMENT.md');
  allChecks &= checkFile('CHANGELOG.md', 'CHANGELOG.md');
  allChecks &= checkFile('QUICKSTART.md', 'QUICKSTART.md');
  
  // Check node_modules
  log('\nChecking dependencies...', 'yellow');
  if (checkDirectory('node_modules', 'node_modules/')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const criticalDeps = [
      'electron',
      'better-sqlite3',
      'bcrypt',
      'typescript',
      'qrcode',
      'date-fns'
    ];
    
    criticalDeps.forEach(dep => {
      const exists = fs.existsSync(path.join('node_modules', dep));
      if (exists) {
        log(`  ✓ ${dep}`, 'green');
      } else {
        log(`  ✗ ${dep} - NOT INSTALLED`, 'red');
        allChecks = false;
      }
    });
  } else {
    log('  ⚠ Run "npm install" to install dependencies', 'yellow');
    allChecks = false;
  }
  
  // Check if built
  log('\nChecking build output...', 'yellow');
  if (checkDirectory('dist', 'dist/ directory')) {
    checkDirectory('dist/main', 'dist/main/');
    checkDirectory('dist/renderer', 'dist/renderer/');
    checkDirectory('dist/preload', 'dist/preload/');
  } else {
    log('  ⚠ Run "npm run build" to compile TypeScript', 'yellow');
  }
  
  // Summary
  log('\n=== Summary ===\n', 'blue');
  
  if (allChecks) {
    log('✓ All checks passed! Your setup is ready.', 'green');
    log('\nNext steps:', 'yellow');
    log('  1. npm run build    (if not built yet)');
    log('  2. npm start        (to run the app)');
    log('  3. npm run dev      (for development)\n');
  } else {
    log('✗ Some checks failed. Please review the errors above.', 'red');
    log('\nCommon fixes:', 'yellow');
    log('  1. npm install      (install dependencies)');
    log('  2. npm run build    (compile TypeScript)');
    log('  3. Check file paths (case-sensitive on Linux/Mac)\n');
  }
}

main();
