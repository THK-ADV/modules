#!/bin/bash

# Production build script for SvelteKit Docker container
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building SvelteKit production container...${NC}"

# Generate build metadata
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=${1:-latest}

echo -e "${YELLOW}📋 Build Info:${NC}"
echo "  Build Date: $BUILD_DATE"
echo "  Git Commit: $VCS_REF"
echo "  Version: $VERSION"
echo ""

# Build the container
docker build \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg VCS_REF="$VCS_REF" \
  --build-arg VERSION="$VERSION" \
  -t sveltekit-app:$VERSION \
  -t sveltekit-app:latest \
  .

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo -e "${YELLOW}🏃 To run the container:${NC}"
echo "  docker run --env-file .env -p 3000:3000 sveltekit-app:latest"
echo ""
echo -e "${YELLOW}🐳 Or with docker-compose:${NC}"
echo "  VERSION=$VERSION docker-compose up -d" 