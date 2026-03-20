# Deployment Guide

## Quick Deploy

### Patch Release (Bug fixes)
```bash
# Unix/Linux/Mac
bun run deploy:patch
# or
./deploy.sh patch

# Windows
deploy.bat patch
```

### Minor Release (New features)
```bash
bun run deploy:minor
```

### Major Release (Breaking changes)
```bash
bun run deploy:major
```

## What the Deploy Script Does

1. **Checks for uncommitted changes** - Ensures working tree is clean
2. **Bumps version** - Updates package.json version (patch/minor/major)
3. **Creates commit** - Commits version bump with conventional message
4. **Creates git tag** - Tags release as `v{version}`
5. **Pushes to remote** - Pushes commit and tags
6. **Deploys to Docker** - Rebuilds and restarts container

## Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Bump version
npm version patch  # or minor/major

# 2. Push to remote
git push
git push --tags

# 3. Deploy to Docker
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Version Bumping Types

| Type | Example | When to Use |
|------|---------|-------------|
| `patch` | 0.1.0 → 0.1.1 | Bug fixes, small changes |
| `minor` | 0.1.0 → 0.2.0 | New features, backward compatible |
| `major` | 0.1.0 → 1.0.0 | Breaking changes |

## Docker Commands

```bash
# View logs
bun run docker:logs

# Stop container
bun run docker:down

# Restart container
bun run docker:restart

# Clean everything (including volumes)
bun run docker:clean
```

## Troubleshooting

### Container name already in use
```bash
docker stop coffee-tracker-sync
docker rm coffee-tracker-sync
bun run docker:rebuild
```

### Uncommitted changes
```bash
# Commit your changes first
git add .
git commit -m "your message"

# Or stash them
git stash
```

### View deployment history
```bash
git tag -l
git log --oneline --decorate
```

## Accessing Your App

After deployment:
- **Local**: http://localhost:5001
- **Network**: Check your IP address and use http://{YOUR_IP}:5001
