# Claude Context for Coffee Tracker MVP

This document provides context for AI assistants working on the Coffee Tracker MVP project.

## Project Overview

**Coffee Tracker MVP** is a personal coffee tracking application with:
- React 19 + TypeScript frontend
- Express backend with file-based storage
- Docker deployment support
- Automated versioning and deployment

**Target Use:** Personal/local coffee consumption tracking
**Current Status:** Functional MVP with CORS + rate limiting
**Production Ready:** No - lacks authentication (see `.docs/SECURITY_AUDIT.md`)

## Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Strict type checking enabled
- **Vite** - Fast build tool with HMR
- **Material-UI (MUI)** - Component library with dark theme
- **Emotion** - CSS-in-JS (used by MUI)

### Backend
- **Express** - Minimal web server
- **File-based storage** - JSON database in `./data/coffee-data.json`
- **No database server** - Simple file I/O

### DevOps
- **Docker** - Multi-stage builds with Alpine
- **Docker Compose** - Single-command deployment
- **Git** - Version control with conventional commits
- **Bun** - Preferred package manager (Node.js compatible)

## Architecture

### Component Structure

```
src/
├── features/coffee-tracker/     # Feature-based organization
│   ├── components/              # Feature-specific components
│   │   ├── CoffeeCountButton.tsx
│   │   ├── CoffeeTracker.tsx    # Main container
│   │   └── TodayEntriesList.tsx
│   ├── hooks/
│   │   └── useCoffeeEntries.ts  # Business logic hook
│   └── types/
│       └── CoffeeEntry.types.ts # Shared types
├── lib/api/
│   └── client.ts                # API client (singleton pattern)
├── config/
│   ├── app.config.ts            # App configuration
│   └── version.ts               # Auto-generated from package.json
├── shared/
│   ├── styles/theme.ts          # MUI theme (dark mode)
│   └── utils/date.ts            # Date utilities
└── App.tsx                      # Root component
```

### Data Flow

1. **User Action** → Component calls `useCoffeeEntries` hook
2. **Hook** → Calls `apiClient` method
3. **API Client** → Makes `fetch` request to Express server
4. **Express** → Reads/writes `data/coffee-data.json`
5. **Response** → Hook updates React state
6. **Component** → Re-renders with new data

### Key Patterns

#### 1. Feature-Based Organization
- Components organized by feature, not type
- Each feature has its own `components/`, `hooks/`, `types/`
- Makes code easier to find and maintain

#### 2. Custom Hooks for Business Logic
- `useCoffeeEntries` encapsulates all coffee entry logic
- Provides clean API for components
- Easy to test and reuse

#### 3. Singleton API Client
- `apiClient` is a singleton instance
- Shared across all components
- Consistent API interface

#### 4. Type Safety
- All API responses typed with `CoffeeEntry` interface
- Zod validation in types
- TypeScript strict mode enabled

## Development Workflow

### Getting Started

```bash
# Install dependencies
bun install

# Development server (frontend only)
bun run dev

# Full stack (frontend + backend)
bun run dev  # Terminal 1 (frontend)
bun run start  # Terminal 2 (backend)
```

### Making Changes

1. **Create feature branch** (optional, for personal use you can work on main)
2. **Make changes** following existing patterns
3. **Test locally**
4. **Commit with conventional commit message**
5. **Deploy** (if needed)

### Conventional Commits

**Always use conventional commit messages:**

```bash
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
perf: improve performance
test: add tests
build: build system changes
ci: CI/CD changes
chore: maintenance tasks
```

**Format:** `<type>: <description>`

See [`.docs/COMMIT_CONVENTIONS.md`](.docs/COMMIT_CONVENTIONS.md) for details.

### Deployment

**Quick deploy:**
```bash
bun run deploy:patch   # Bug fixes (1.0.0 → 1.0.1)
bun run deploy:minor   # New features (1.0.0 → 1.1.0)
bun run deploy:major   # Breaking changes (1.0.0 → 2.0.0)
```

**What happens:**
1. Version bumped in `package.json`
2. Commit created with conventional message
3. Git tag created (e.g., `v1.3.0`)
4. Pushed to remote (if configured)
5. Docker container rebuilt and restarted

## Important Files

### Configuration
- `package.json` - Dependencies, scripts, version
- `vite.config.ts` - Vite configuration, version injection
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - Docker services
- `Dockerfile` - Container build instructions

### Source Code
- `server.js` - Express server (no TypeScript)
- `src/App.tsx` - Root component with version display
- `src/lib/api/client.ts` - API client
- `src/features/coffee-tracker/hooks/useCoffeeEntries.ts` - Main business logic

### Deployment
- `deploy.sh` - Automated deployment script
- `commitlint.config.js` - Commit message validation

### Documentation
- `.docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `.docs/COMMIT_CONVENTIONS.md` - Commit conventions
- `.docs/SECURITY_AUDIT.md` - Security analysis
- `README.md` - Project overview

## Code Style

### TypeScript
- Strict mode enabled
- No implicit any
- Explicit return types on exported functions
- Interface over type for objects (usually)

### React
- Functional components with hooks
- No class components
- Props destructured
- Early returns for conditional rendering

### CSS/Styling
- MUI component system
- `sx` prop for one-off styles
- `theme.ts` for global styles
- Dark mode by default

### Naming Conventions
- Components: `PascalCase` (e.g., `CoffeeTracker`)
- Hooks: `use` prefix (e.g., `useCoffeeEntries`)
- Files: `PascalCase.tsx` for components, `kebab-case.ts` for utilities
- Variables: `camelCase`

## Common Tasks

### Adding a New Component

1. Create in `src/features/coffee-tracker/components/`
2. Use functional component with hooks
3. Type props with interface
4. Export as named export
5. Use MUI components for styling

### Adding API Endpoint

1. Add route in `server.js`
2. Validate input (see security audit)
3. Read/write to `data/coffee-data.json`
4. Return JSON response
5. Handle errors gracefully

### Updating Version Display

Version is auto-injected during build:
- Edit `package.json` version
- Run `bun run build`
- Version appears in footer

**DO NOT manually edit `src/config/version.ts`** - it's auto-generated.

### Docker Deployment

```bash
# Build and start
bun run docker:up

# View logs
bun run docker:logs

# Rebuild after code changes
bun run docker:rebuild

# Stop
bun run docker:down
```

## Testing

**Note:** Currently no automated tests. Manual testing required.

### Manual Testing Checklist

- [ ] Add coffee entry
- [ ] Delete coffee entry
- [ ] View today's entries
- [ ] Version display shows correctly
- [ ] Footer displays version + build time
- [ ] Docker container starts successfully
- [ ] API endpoints respond correctly

## Security Considerations

**IMPORTANT:** This app has **NO authentication** (see `.docs/SECURITY_AUDIT.md`):

- ✅ CORS protection (restricted to ALLOWED_ORIGINS)
- ✅ Rate limiting (100 requests/15min per IP)
- ✅ Input validation on all endpoints
- ❌ **NO authentication** - anyone with URL can access
- ⚠️ File-based storage (not concurrent-safe)

**For personal/local use:** ✅ Acceptable with CORS restrictions
**For cloud deployment:** ❌ Must add authentication first

### Security Features Implemented
1. **CORS Protection** - Only allows configured origins
2. **Rate Limiting** - Prevents API abuse
3. **Input Validation** - All API inputs validated
4. **Secure Headers** - Proper security headers configured

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5001
npx kill-port 5001  # macOS/Linux
# or
netstat -ano | findstr :5001  # Windows
```

### Docker Issues
```bash
# Clean everything
bun run docker:clean

# Rebuild from scratch
bun run docker:rebuild
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules dist
bun install
bun run build
```

### Version Not Updating
- Version injected at build time
- Must run `bun run build` after changing version
- Check `vite.config.ts` for injection logic

## Preferences

### User Preferences (from memory)
- ❌ **No Co-Authored-By** in git commits
- ✅ Use conventional commit messages
- ✅ Prefer bun over npm
- ✅ Keep deployment simple
- ✅ Document changes

### Development Philosophy
- **Simplicity over complexity**
- **Working code over perfect code**
- **Documentation as you go**
- **Automate repetitive tasks**

## Future Improvements

### High Priority
- [ ] Add authentication (required for cloud deployment)
- [ ] Migrate from file-based storage to SQLite/PostgreSQL
- [ ] Add automated tests

### Medium Priority
- [ ] Add automated tests
- [ ] Implement authentication
- [ ] Add error boundaries

### Low Priority
- [ ] Migrate to real database
- [ ] Add user settings

## AI Assistant Guidelines

### When Working on This Project

1. **Read existing code first** - Understand patterns before changing
2. **Follow conventions** - Match existing style and structure
3. **Use feature-based organization** - Put code in appropriate feature folders
4. **Test Docker deployment** - Ensure container still works
5. **Document changes** - Update README and relevant docs
6. **Use conventional commits** - Follow the commit convention
7. **Check security implications** - Review security audit before adding features

### Things to Avoid

- ❌ Don't add dependencies without good reason
- ❌ Don't change file structure without discussing
- ❌ Don't disable TypeScript checks
- ❌ Don't commit secrets or credentials
- ❌ Don't deploy to production without security fixes
- ❌ Don't add Co-Authored-By to commits

### Preferred Approaches

- ✅ Edit existing files over creating new ones
- ✅ Use existing components and patterns
- ✅ Keep changes minimal and focused
- ✅ Test locally before committing
- ✅ Ask for clarification if uncertain

---

**Last Updated:** 2026-03-20
**Version:** 1.3.0
**Maintained By:** Project Owner
