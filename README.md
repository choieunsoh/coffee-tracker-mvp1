# Coffee Tracker MVP

A simple coffee tracking application with real-time updates, built with React, TypeScript, and Express.

![Version](https://img.shields.io/badge/version-1.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- ✅ **Track Daily Coffee Consumption** - Log each coffee you drink
- ✅ **Persistent Storage** - File-based database (JSON)
- ✅ **Modern UI** - Built with Material-UI (MUI)
- ✅ **Docker Support** - Easy containerized deployment
- ✅ **Version Tracking** - App displays current version and build time
- ✅ **Automated Deployment** - One-command deployment with version bumping

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI (MUI)** - Component library
- **Emotion** - CSS-in-JS styling

### Backend
- **Express** - Web server
- **Node.js/Bun** - Runtime
- **File-based Storage** - JSON database

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

## Quick Start

### Prerequisites

- Node.js >= 20.19.0 or Bun >= 1.3.0
- Docker (optional, for containerized deployment)

### Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# App runs on http://localhost:3001
```

### Production

```bash
# Build for production
bun run build

# Start production server
bun run start

# App runs on http://localhost:5001
```

### Docker Deployment

```bash
# Quick deploy (build and start)
bun run docker:up

# View logs
bun run docker:logs

# Stop containers
bun run docker:down

# App runs on http://localhost:5001
```

## Ports Configuration

| Environment | Port | URL | Description |
|-------------|------|-----|-------------|
| **Development** | 3001 | http://localhost:3001 | Vite dev server (frontend only) |
| **Production** | 5001 | http://localhost:5001 | Express server (full stack) |
| **Docker** | 5001 | http://localhost:5001 | Containerized application |

### Why Port 5001?

- ✅ **Safe choice** - Not a standard system port
- ✅ **No conflicts** - Doesn't clash with common development tools
- ✅ **Easy to remember** - Simple and consistent
- ✅ **No special permissions** - Works without admin/sudo
- ✅ **Docker-friendly** - Maps cleanly from host to container

**Note:** Port 5001 is used for the production Express server. The Vite dev server uses port 3001 to avoid conflicts during development.

## Version & Deployment

### Automated Deployment

The project includes automated deployment scripts that handle version bumping, git tagging, and Docker deployment:

```bash
# Patch release (bug fixes)
bun run deploy:patch

# Minor release (new features)
bun run deploy:minor

# Major release (breaking changes)
bun run deploy:major
```

### What the Deploy Script Does

1. ✅ Bumps version in `package.json`
2. ✅ Commits changes with conventional commit message
3. ✅ Creates git tag (e.g., `v1.3.0`)
4. ✅ Pushes to remote (if configured)
5. ✅ Rebuilds Docker container
6. ✅ Restarts the application

### Version Display

The app displays version and build time in the footer:
```
v1.3.0 • 20/03/2026 14:30:45
```

## Project Structure

```
coffee-tracker-mvp/
├── src/
│   ├── features/
│   │   └── coffee-tracker/
│   │       ├── components/    # React components
│   │       ├── hooks/         # Custom hooks
│   │       └── types/         # TypeScript types
│   ├── lib/
│   │   └── api/
│   │       └── client.ts      # API client
│   ├── config/
│   │   └── version.ts         # Version config (auto-generated)
│   ├── shared/
│   │   ├── styles/
│   │   └── utils/
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
├── server.js                  # Express server
├── deploy.sh                  # Deployment script
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose config
└── package.json               # Dependencies and scripts
```

## Database

### JSON File Storage

This application uses a **simple JSON file** for data storage:

- **Location:** `./data/coffee-data.json`
- **Format:** Array of coffee entry objects
- **Managed by:** Express server (`server.js`)

### Data Structure

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "brand": "Starbucks",
    "beanName": "House Blend",
    "createdAt": 1679089200000
  }
]
```

### How It Works

1. **Server reads** JSON file on API requests
2. **Server writes** back to file on changes
3. **File persisted** in `./data/` directory
4. **Auto-created** if file doesn't exist

### Advantages

- ✅ **Simple** - No database server needed
- ✅ **Portable** - Easy to backup and migrate
- ✅ **Human-readable** - Can edit JSON directly
- ✅ **Sufficient** for personal/single-user apps

### Limitations

- ⚠️ **Not concurrent** - Race conditions with multiple users
- ⚠️ **No ACID** - No transaction guarantees
- ⚠️ **Not scalable** - Not suitable for high traffic
- ⚠️ **Single device** - No multi-device sync

### For Production Use

Consider upgrading to:
- **SQLite** - Single-file SQL database (better performance)
- **PostgreSQL** - Full production database
- **MySQL** - Alternative SQL database

See [`.docs/SECURITY_AUDIT.md`](.docs/SECURITY_AUDIT.md) for database recommendations.

## API Endpoints

### GET /api/entries
Get coffee entries for today or since a specific date.

```bash
# Get today's entries
curl http://localhost:5001/api/entries

# Get entries since timestamp
curl http://localhost:5001/api/entries?startDate=1679089200000
```

### POST /api/entries
Add a new coffee entry.

```bash
curl -X POST http://localhost:5001/api/entries \
  -H "Content-Type: application/json" \
  -d '{"brand":"Starbucks","beanName":"House Blend"}'
```

### DELETE /api/entries/:id
Delete a coffee entry.

```bash
curl -X DELETE http://localhost:5001/api/entries/abc123
```

## Docker Commands

```bash
# Build Docker image
bun run docker:build

# Start containers
bun run docker:up

# Stop containers
bun run docker:down

# Restart containers
bun run docker:restart

# View logs
bun run docker:logs

# Clean build (rebuild from scratch)
bun run docker:rebuild

# Remove everything (including volumes)
bun run docker:clean
```

## Configuration

### Environment Variables

Currently, the app uses default configuration. You can customize:

- `PORT` - Server port (default: 5001)
- `NODE_ENV` - Environment (development/production)

### Data Storage

Coffee entries are stored in `./data/coffee-data.json` on the server.

## Development

### Conventional Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format:**
```
<type>[optional scope]: <description>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Build system or dependencies
- `ci` - CI/CD changes
- `chore` - Other changes

**Examples:**
```bash
git commit -m "feat: add coffee entry deletion"
git commit -m "fix: prevent duplicate entries"
git commit -m "docs: update deployment guide"
```

See [`.docs/COMMIT_CONVENTIONS.md`](.docs/COMMIT_CONVENTIONS.md) for details.

## Documentation

- [Deployment Guide](.docs/DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Commit Conventions](.docs/COMMIT_CONVENTIONS.md) - Conventional commits guide
- [Security Audit](.docs/SECURITY_AUDIT.md) - Security analysis and recommendations
- [Docker Setup](.docs/DEPLOYMENT.md) - Docker deployment instructions
- [Network Setup](.docs/NETWORK_SETUP.md) - Network configuration guide

## Security

⚠️ **This app is designed for personal/local use.**

Before deploying to production, please review the [Security Audit](.docs/SECURITY_AUDIT.md) which identifies:
- Wide-open CORS configuration
- Missing input validation
- No rate limiting
- No authentication

**For personal use:** Current setup is fine.
**For production:** Security improvements required.

## Contributing

1. Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
2. Follow [Conventional Commits](.docs/COMMIT_CONVENTIONS.md)
3. Write meaningful commit messages
4. Test your changes

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues, questions, or suggestions:
1. Check the [Security Audit](.docs/SECURITY_AUDIT.md)
2. Review the [Deployment Guide](.docs/DEPLOYMENT_GUIDE.md)
3. Open an issue on GitHub

---

**Built with** ☕ and React
