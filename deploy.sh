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

# Bump version
print_info "Bumping version..."
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version | sed 's/^v//')
print_info "New version: $NEW_VERSION"

# Commit version bump
print_info "Committing version bump..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create git tag
print_info "Creating git tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# Check if remote exists and push
if git remote get-url origin >/dev/null 2>&1; then
    print_info "Remote found - pushing to origin..."
    git push
    git push --tags
else
    print_warning "No remote configured - skipping git push"
    print_warning "Tag v$NEW_VERSION created locally only"
fi

# Deploy to Docker
print_info "Building and deploying Docker container..."
export APP_VERSION=$NEW_VERSION
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

# Show Docker images with version tags
echo ""
print_info "Docker images:"
docker images --filter "reference=coffee-tracker:*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
