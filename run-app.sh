#!/bin/bash

echo "SimplePOS Electron - Starting Application"
echo "========================================="

# Clean and rebuild with proper permissions
echo "Cleaning build directory..."
sudo rm -rf dist
mkdir -p dist

echo "Building application..."
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful!"
  echo "Starting Electron app..."
  
  # Run electron directly
  ./node_modules/.bin/electron . --no-sandbox
else
  echo "Build failed. Please check the errors above."
  exit 1
fi
