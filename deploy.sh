#!/bin/bash

# Deployment Script for Coffee Tracker MVP
# Usage: ./deploy.sh [patch|minor|major]
# Default: patch

set -e  # Exit on error

# Check if running in bash/sh
if [ -z "$BASH_VERSION" ] && [ -z "$ZSH_VERSION" ]; then
    echo "Error: This script must be run with bash"
    echo "Usage: bash deploy.sh [patch|minor|major]"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if uncommitted changes exist
if [ -n "$(git status --porcelain)" ]; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Get version bump type (default: patch)
VERSION_TYPE=${1:-patch}

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Invalid version type: $VERSION_TYPE"
    echo "Usage: $0 [patch|minor|major]"
    exit 1
fi

print_info "Starting deployment process..."
print_info "Version bump type: $VERSION_TYPE"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

# Bump version using npm
print_info "Bumping version..."
npm version $VERSION_TYPE -m "chore: bump version to %s"

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
print_info "New version: $NEW_VERSION"

# Update version.ts
print_info "Updating version in source code..."
echo "export const APP_VERSION = '$NEW_VERSION';" > src/config/version.ts
echo "export const BUILD_DATE = '$(date -u +"%Y-%m-%dT%H:%M:%SZ")';" >> src/config/version.ts
git add src/config/version.ts
git commit --amend --no-edit

# Create and push git tag
print_info "Creating git tag v$NEW_VERSION..."

# Check if tag already exists and remove it
if git rev-parse "$NEW_VERSION" >/dev/null 2>&1; then
    print_warning "Tag v$NEW_VERSION already exists. Removing old tag..."
    git tag -d "v$NEW_VERSION" || true
    git push origin ":refs/tags/v$NEW_VERSION" || true
fi

git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# Push commit and tags
print_info "Pushing to remote..."
git push
git push --tags

# Deploy to Docker
print_info "Building and deploying Docker container..."
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

print_info "✅ Deployment successful!"
print_info "Version: $NEW_VERSION"
print_info "Tag: v$NEW_VERSION"
print_info "Container: coffee-tracker-sync"

# Show container status
echo ""
docker ps --filter "name=coffee-tracker-sync" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
