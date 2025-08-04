#!/bin/bash
# Docker build script for production
set -e

echo "Loading production environment variables..."
set -a  # Export all variables
source .env.production
set +a  # Stop exporting

echo "Building frontend for production..."
docker compose build frontend