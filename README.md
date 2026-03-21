# Coffee Tracker MVP

A simple coffee tracking application with Facebook authentication, built with React, TypeScript, and Express.

![Version](https://img.shields.io/badge/version-1.5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- ✅ **Facebook Authentication** - Secure OAuth login with multi-user support
- ✅ **Track Daily Coffee Consumption** - Log each coffee you drink
- ✅ **User Data Isolation** - Each user has their own private coffee entries
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
- **Passport.js** - Authentication framework
- **Facebook OAuth** - Third-party authentication
- **Express Session** - Session management
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

| Environment     | Port | URL                     | Description                     |
| --------------- | ---- | ----------------------- | ------------------------------- |
| **Development** | 3001 | <http://localhost:3001> | Vite dev server (frontend only) |
| **Production**  | 5001 | <http://localhost:5001> | Express server (full stack)     |
| **Docker**      | 5001 | <http://localhost:5001> | Containerized application       |

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
v1.5.0 • 20/03/2026 14:30:45
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
    "userId": "facebook:123456789",
    "brand": "Starbucks",
    "beanName": "House Blend",
    "createdAt": 1679089200000
  }
]
```

**Note:** Each entry is associated with a user via the `userId` field. Users can only access their own entries.

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

**Note:** All API endpoints require authentication. You must be logged in via Facebook OAuth to access these endpoints.

### Authentication Endpoints

#### GET /api/auth/facebook

Initiates Facebook OAuth login flow.

#### GET /api/auth/facebook/callback

OAuth callback endpoint (handled by Passport.js).

#### GET /api/auth/me

Returns current authenticated user info.

```bash
curl http://localhost:5001/api/auth/me --cookie-jar cookies.txt --cookie cookies.txt
```

#### POST /api/auth/logout

Logs out the current user and destroys session.

```bash
curl -X POST http://localhost:5001/api/auth/logout --cookie-jar cookies.txt --cookie cookies.txt
```

### Data Endpoints (Require Authentication)

#### GET /api/entries

Get coffee entries for today or since a specific date.

```bash
# Get today's entries (requires authentication)
curl http://localhost:5001/api/entries --cookie-jar cookies.txt --cookie cookies.txt

# Get entries since timestamp (requires authentication)
curl "http://localhost:5001/api/entries?startDate=1679089200000" --cookie-jar cookies.txt --cookie cookies.txt
```

#### POST /api/entries

Add a new coffee entry (requires authentication).

```bash
curl -X POST http://localhost:5001/api/entries \
  -H "Content-Type: application/json" \
  -d '{"brand":"Starbucks","beanName":"House Blend"}' \
  --cookie-jar cookies.txt --cookie cookies.txt
```

#### DELETE /api/entries/:id

Delete a coffee entry (requires authentication, ownership verified).

```bash
curl -X DELETE http://localhost:5001/api/entries/abc123 --cookie-jar cookies.txt --cookie cookies.txt
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

Create a `.env` file in the project root:

```bash
# Facebook OAuth Credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# Session Secret (generate with: bun run generate:session-secret)
SESSION_SECRET=your_random_session_secret_here

# Session expiration time in days (default: 7)
SESSION_EXPIRE_DAYS=7

# Allowed CORS origins (comma-separated)
# For local development:
ALLOWED_ORIGINS=http://localhost:5001

# For production deployment:
# ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Environment
NODE_ENV=production
```

**Required Variables:**

- `FACEBOOK_APP_ID` - Facebook App ID from <https://developers.facebook.com/apps/>
- `FACEBOOK_APP_SECRET` - Facebook App Secret
- `SESSION_SECRET` - Random string for session encryption

**Optional Variables:**

- `SESSION_EXPIRE_DAYS` - Session duration in days (default: 7)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (default: <http://localhost:5001>)
- `PORT` - Server port (default: 5001)
- `NODE_ENV` - Environment (development/production)

**Setup Guide:** See [`.docs/FACEBOOK_AUTH_SETUP.md`](.docs/FACEBOOK_AUTH_SETUP.md) for detailed Facebook App setup instructions.

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

- [Facebook Auth Setup](.docs/FACEBOOK_AUTH_SETUP.md) - Complete Facebook OAuth setup guide
- [Facebook Auth Summary](.docs/FACEBOOK_AUTH_SUMMARY.md) - Implementation overview
- [Facebook Auth Verification](.docs/FACEBOOK_AUTH_VERIFICATION.md) - Implementation verification report
- [Configuration Guide](.docs/CONFIGURATION_GUIDE.md) - Complete configuration documentation
- [Deployment Guide](.docs/DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Commit Conventions](.docs/COMMIT_CONVENTIONS.md) - Conventional commits guide
- [Security Audit](.docs/SECURITY_AUDIT.md) - Security analysis and recommendations
- [Docker Setup](.docs/DEPLOYMENT.md) - Docker deployment instructions
- [Network Setup](.docs/NETWORK_SETUP.md) - Network configuration guide

## Security

✅ **This app now includes Facebook OAuth authentication for multi-user support.**

### Current Security Features

- ✅ **Facebook OAuth** - Secure third-party authentication
- ✅ **Session Management** - Secure httpOnly cookies
- ✅ **User Data Isolation** - Each user can only access their own entries
- ✅ **CORS Protection** - Restricts API access to allowed origins
- ✅ **Rate Limiting** - 100 requests per 15 minutes per IP
- ✅ **Input Validation** - All API inputs validated
- ✅ **Secure Headers** - Proper CORS and security headers
- ✅ **CSRF Protection** - SameSite cookie protection

### Authentication Flow

1. User clicks "Continue with Facebook"
2. Redirected to Facebook OAuth page
3. User approves app
4. Facebook redirects back with access token
5. Server creates secure session
6. User can now access protected endpoints
7. Session expires after 24 hours

### Data Privacy

- Each user's coffee entries are private
- Users can only see their own entries
- Ownership verified on DELETE operations
- Session cookies are httpOnly (prevent XSS)

### Before Deploying to Production

**Required for Production:**

- ✅ HTTPS/TLS (required for Facebook OAuth in production)
- ✅ Update Facebook OAuth settings with production URLs
- ✅ Use production Facebook App (separate from development)
- ✅ Strong, randomly generated SESSION_SECRET
- ✅ Configure ALLOWED_ORIGINS with production domain(s)

**Recommended for Production:**

- Use Redis/MongoDB for session storage (instead of MemoryStore)
- Enable secure cookies (set `cookie.secure: true`)
- Add monitoring for failed authentication attempts
- Set up database backup strategy

### Development vs Production

**Development (localhost):**

- HTTP is acceptable
- `cookie.secure: false` (required for HTTP)
- Use test Facebook App

**Production:**

- MUST use HTTPS
- `cookie.secure: true`
- Use production Facebook App
- Update OAuth redirect URIs

See [`.docs/FACEBOOK_AUTH_SETUP.md`](.docs/FACEBOOK_AUTH_SETUP.md) for production deployment guide.

## Contributing

1. Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
2. Follow [Conventional Commits](.docs/COMMIT_CONVENTIONS.md)
3. Write meaningful commit messages
4. Test your changes

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues, questions, or suggestions:
HTTP)

- Use test Facebook App

**Production:**

- MUST use HTTPS
- `cookie.secure: true`
- Use production Facebook App
- Update OAuth redirect URIs

See [`.docs/FACEBOOK_AUTH_SETUP.md`](.docs/FACEBOOK_AUTH_SETUP.md) for production deployment guide.

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
