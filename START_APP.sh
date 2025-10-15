#!/bin/bash

echo "================================================"
echo "       SimplePOS Electron - Quick Start        "
echo "================================================"
echo ""
echo "This script will help you start the application"
echo ""

# Check if dist folder exists and has permission issues
if [ -d "dist" ]; then
    if [ ! -w "dist" ]; then
        echo "⚠️  Permission issue detected in dist folder"
        echo "   You need to run: sudo rm -rf dist"
        echo "   Then run this script again"
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Starting SimplePOS..."
    echo ""
    echo "================================================"
    echo "  Default Login: admin / admin"
    echo "  Dark Mode: Click 🌙 button (bottom-right)"
    echo "================================================"
    echo ""
    
    # Start the application
    npm start
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "If you see permission errors, please run:"
    echo "  sudo rm -rf dist node_modules"
    echo "  npm install"
    echo "  npm run build"
    echo "  sudo npm start"
    exit 1
fi
