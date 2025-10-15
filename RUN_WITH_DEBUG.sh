#!/bin/bash

echo "========================================="
echo "SimplePOS - Debug Mode"
echo "========================================="
echo ""

# Build first
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✓ Build completed"
echo ""
echo "========================================="
echo "Starting application with debug logging"
echo "========================================="
echo ""
echo "IMPORTANT: Watch for these logs:"
echo ""
echo "1. Database initialization:"
echo "   [DB] ✓ Admin user verified: ..."
echo ""
echo "2. When you click Login:"
echo "   [AUTH] ========== LOGIN ATTEMPT =========="
echo "   [AUTH] Username: admin"
echo "   [AUTH] ✓ User found in database"
echo "   [AUTH] Password match result: true"
echo "   [AUTH] ========== LOGIN SUCCESS =========="
echo ""
echo "3. In DevTools Console (opens automatically):"
echo "   [RENDERER] Login attempt with username: admin"
echo "   [RENDERER] Login response: {id: 1, ...}"
echo "   [RENDERER] Login successful, updating UI..."
echo ""
echo "========================================="
echo ""
echo "Login Credentials:"
echo "  Username: admin"
echo "  Password: admin"
echo ""
echo "DevTools will open automatically."
echo "Check the Console tab for [RENDERER] logs."
echo ""
echo "Press Ctrl+C to stop the application."
echo ""
echo "========================================="
echo ""

# Start with sudo if needed
if [ "$EUID" -eq 0 ]; then
    npm start
else
    echo "Note: Running without sudo. If you see permission errors,"
    echo "restart with: sudo ./RUN_WITH_DEBUG.sh"
    echo ""
    npm start
fi
