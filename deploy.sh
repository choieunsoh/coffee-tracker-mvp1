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

# Check remote before pushing
print_info "Checking remote configuration..."

# Check if remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
    print_error "No remote 'origin' found. Please add a remote first:"
    echo "  git remote add origin <repository-url>"
    exit 1
fi

REMOTE_URL=$(git remote get-url origin)
print_info "Remote: $REMOTE_URL"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Check if we're pushing to the right branch
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_warning "Not on main/master branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Check if remote has commits we don't have
print_info "Checking for remote changes..."
git fetch origin >/dev/null 2>&1 || true

if git rev-parse --verify "origin/$CURRENT_BRANCH" >/dev/null 2>&1; then
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse "origin/$CURRENT_BRANCH")

    if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
        print_error "Local and remote branches have diverged!"
        echo ""
        echo "Local commits:"
        git log --oneline HEAD ^origin/$CURRENT_BRANCH 2>/dev/null || echo "  (none)"
        echo ""
        echo "Remote commits:"
        git log --oneline origin/$CURRENT_BRANCH ^HEAD 2>/dev/null || echo "  (none)"
        echo ""
        read -p "Pull remote changes first? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Pulling remote changes..."
            git pull origin $CURRENT_BRANCH
            print_warning "Please review changes and run deployment again"
            exit 1
        else
            print_error "Deployment cancelled to prevent conflicts"
            exit 1
        fi
    fi
fi

print_info "Remote check passed ✓"

# Create git tag
print_info "Creating git tag v$NEW_VERSION..."
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
