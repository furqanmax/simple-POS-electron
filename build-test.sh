#!/bin/bash

echo "======================================"
echo "SimplePOS Build & Test Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building Main Process...${NC}"
npm run build:main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Main process build successful${NC}"
else
    echo -e "${RED}✗ Main process build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Building Renderer Process...${NC}"
npm run build:renderer
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Renderer process build successful${NC}"
else
    echo -e "${RED}✗ Renderer process build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Building Preload Script...${NC}"
npm run build:preload
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Preload script build successful${NC}"
else
    echo -e "${RED}✗ Preload script build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 4: Running Post-build Script...${NC}"
node scripts/postbuild.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Post-build script successful${NC}"
else
    echo -e "${RED}✗ Post-build script failed${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo "======================================"
echo ""
echo "To start the application, run:"
echo "  sudo npm start"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: admin"
