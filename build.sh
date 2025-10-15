#!/bin/bash

echo "Building SimplePOS Electron Application..."

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the application
echo "Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful!"
  echo "You can now run the app with: npm start"
else
  echo "Build failed. Please check the errors above."
  exit 1
fi
