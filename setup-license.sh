#!/bin/bash

# Nuvana License Configuration Script for SimplePOS
# This script helps you set up your Nuvana licensing credentials

echo "========================================"
echo "SimplePOS - Nuvana License Configuration"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Please enter your Nuvana credentials:"
echo "(Get these from https://licensing.nuvanasolutions.in)"
echo ""

# Read Product Code
read -p "Enter your Product Code: " PRODUCT_CODE
if [ -z "$PRODUCT_CODE" ]; then
    PRODUCT_CODE="SIMPLEPOS-ELECTRON"
    echo "  Using default: $PRODUCT_CODE"
fi

# Read Secret Key
read -p "Enter your Secret Key: " SECRET_KEY
if [ -z "$SECRET_KEY" ]; then
    echo "  ⚠️  Warning: No secret key provided. You'll need to add it later."
    SECRET_KEY="your-secret-key-here"
fi

# Read Public Key
read -p "Enter your Public Key (optional): " PUBLIC_KEY
if [ -z "$PUBLIC_KEY" ]; then
    PUBLIC_KEY="base64:MC4CAQAwBQYDK2VwBCIEIBn3BYdNJRWJJnpSDMRn8wRzEKWFALe4t5w3xKe4X0+C"
    echo "  Using default public key"
fi

# Update .env file
echo ""
echo "Updating .env file..."

# Function to update or add a line in .env
update_env() {
    local key=$1
    local value=$2
    if grep -q "^$key=" .env; then
        # Update existing line
        sed -i "s|^$key=.*|$key=$value|" .env
    else
        # Add new line
        echo "$key=$value" >> .env
    fi
}

# Update the values
update_env "NUVANA_LICENSE_URL" "https://licensing.nuvanasolutions.in"
update_env "NUVANA_PRODUCT_CODE" "$PRODUCT_CODE"
update_env "NUVANA_SECRET" "$SECRET_KEY"
update_env "NUVANA_PUBLIC_KEY" "$PUBLIC_KEY"

echo "✓ Configuration saved to .env"
echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Build the application: npm run build"
echo "2. Start SimplePOS: npm start"
echo "3. The app will start in trial mode (30 days)"
echo "4. To activate a license, go to Settings > License Management"
echo ""
echo "To test your configuration:"
echo "  node test-nuvana-license.js"
echo ""

# Ask if user wants to build now
read -p "Would you like to build the application now? (y/n): " BUILD_NOW
if [ "$BUILD_NOW" = "y" ] || [ "$BUILD_NOW" = "Y" ]; then
    echo "Building application..."
    npm run build
    echo ""
    echo "✓ Build complete!"
    echo "You can now start the application with: npm start"
fi
