#!/bin/bash

echo "========================================="
echo "SimplePOS - Quick Test Script"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "✓ Project directory confirmed"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed"
        exit 1
    fi
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if dist exists, if not build
if [ ! -d "dist" ] || [ ! -f "dist/renderer/renderer/app.js" ]; then
    echo "⚠️  Build artifacts not found. Building project..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed"
        exit 1
    fi
    echo "✓ Build completed"
    echo ""
fi

# Check database
DB_PATH="$HOME/.config/simple-pos-electron/pos.db"
if [ -f "$DB_PATH" ]; then
    echo "✓ Database found at: $DB_PATH"
    
    # Check for admin user
    ADMIN_CHECK=$(sqlite3 "$DB_PATH" "SELECT username FROM users WHERE username='admin' LIMIT 1;" 2>/dev/null)
    if [ "$ADMIN_CHECK" = "admin" ]; then
        echo "✓ Admin user exists in database"
    else
        echo "⚠️  Admin user not found in database"
        echo "   Database will be reinitialized on app start"
    fi
else
    echo "ℹ️  Database not found (will be created on first run)"
fi

echo ""
echo "========================================="
echo "Pre-flight Check Complete!"
echo "========================================="
echo ""
echo "Login Credentials:"
echo "  Username: admin"
echo "  Password: admin"
echo ""
echo "Starting application..."
echo ""
echo "Tips:"
echo "  - Press Ctrl+Shift+I to open DevTools"
echo "  - Check console for [RENDERER] and [AUTH] logs"
echo "  - Press Ctrl+C in terminal to stop the app"
echo ""
echo "========================================="
echo ""

# Start the application
npm start
