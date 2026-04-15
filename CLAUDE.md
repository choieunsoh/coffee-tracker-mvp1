# Claude Context for Coffee Tracker MVP

This document provides context for AI assistants working on the Coffee Tracker MVP project.

## Project Overview

**Coffee Tracker MVP** is a multi-user coffee tracking application with:

- React 19 + TypeScript frontend
- Express backend with file-based storage
- Facebook OAuth authentication
- User-specific data isolation
- Docker deployment support
- Automated versioning and deployment

**Target Use:** Personal/local coffee consumption tracking with multi-user support
**Current Status:** Functional MVP with Facebook authentication
**Production Ready:** Yes - with proper Facebook OAuth configuration
**Version:** 1.5.0

## Tech Stack

### Frontend

- **React 19** - Latest React with concurrent features
- **TypeScript** - Strict type checking enabled
- **Vite** - Fast build tool with HMR
- **Material-UI (MUI)** - Component library with dark theme
- **Emotion** - CSS-in-JS (used by MUI)

### Backend

- **Express** - Minimal web server
- **Passport.js** - Authentication framework
- **Facebook OAuth** - Third-party authentication
- **Express Session** - Session management with httpOnly cookies
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
│   │   ├── TodayEntriesList.tsx
│   │   ├── LoginPage.tsx        # Facebook OAuth login page
│   │   └── UserProfile.tsx      # User profile header
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── hooks/
│   │   └── useCoffeeEntries.ts  # Business logic hook
│   └── types/
│       └── CoffeeEntry.types.ts # Shared types
├── lib/api/
│   └── client.ts                # API client (singleton pattern, credentials: 'include')
├── config/
│   ├── app.config.ts            # App configuration
│   └── version.ts               # Auto-generated from package.json
├── shared/
│   ├── styles/theme.ts          # MUI theme (dark mode)
│   └── utils/date.ts            # Date utilities
└── App.tsx                      # Root component (wrapped with AuthProvider)
```

### Data Flow

1. **User visits app** → AuthContext checks `/api/auth/me` for authentication
2. **Not authenticated** → Shows LoginPage
3. **User clicks "Continue with Facebook"** → Redirects to `/api/auth/facebook`
4. **Facebook OAuth** → User approves app → Redirects to `/api/auth/facebook/callback`
5. **Server creates session** → Stores user info in session → Redirects to `/`
6. **AuthContext detects user** → Shows main app with UserProfile
7. **User Action** → Component calls `useCoffeeEntries` hook
8. **Hook** → Calls `apiClient` method (with credentials: 'include')
9. **API Client** → Makes `fetch` request with session cookie
10. **Express** → Verifies session → Filters data by userId → Reads/writes `data/coffee-data.json`
11. **Response** → Hook updates React state
12. **Component** → Re-renders with new data

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
- Use `type` instead of `interface` (user preference)

#### 5. Authentication Pattern

- **Server-side OAuth flow** using Passport.js (not client-side SDK)
- **Session-based authentication** with httpOnly cookies
- **AuthContext** provides authentication state to all components
- **Protected routes** require authentication via `requireAuth` middleware
- **User data isolation** - all data operations filter by userId
- **Credentials: 'include'** - all fetch calls include session cookies

#### 6. Data Isolation

- All coffee entries have `userId` field
- API routes filter data by authenticated user's ID
- DELETE operations verify entry ownership
- First user gets existing data migrated to their account

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

- `server.js` - Express server with Passport.js authentication
- `src/App.tsx` - Root component with AuthProvider wrapper
- `src/lib/api/client.ts` - API client with credentials: 'include'
- `src/features/coffee-tracker/contexts/AuthContext.tsx` - Authentication state management
- `src/features/coffee-tracker/components/LoginPage.tsx` - Facebook OAuth login page
- `src/features/coffee-tracker/components/UserProfile.tsx` - User profile header
- `src/features/coffee-tracker/hooks/useCoffeeEntries.ts` - Main business logic

### Deployment

- `deploy.sh` - Automated deployment script
- `commitlint.config.js` - Commit message validation

### Documentation

- `.docs/FACEBOOK_AUTH_SETUP.md` - Facebook OAuth setup guide
- `.docs/FACEBOOK_AUTH_SUMMARY.md` - Authentication implementation summary
- `.docs/FACEBOOK_AUTH_VERIFICATION.md` - Implementation verification report
- `.docs/CONFIGURATION_GUIDE.md` - Complete configuration documentation
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

**IMPORTANT:** This app now has **Facebook OAuth authentication** (see `.docs/FACEBOOK_AUTH_SETUP.md`):

- ✅ Facebook OAuth authentication (secure third-party identity)
- ✅ Session-based authentication (httpOnly cookies)
- ✅ User data isolation (each user sees only their entries)
- ✅ CORS protection (restricted to ALLOWED_ORIGINS)
- ✅ Rate limiting (100 requests/15min per IP)
- ✅ Input validation on all endpoints
- ✅ CSRF protection (sameSite cookies)
- ✅ Configurable session duration (SESSION_EXPIRE_DAYS)
- ⚠️ File-based storage (not concurrent-safe)

**For personal/local use:** ✅ Fully functional with authentication
**For cloud deployment:** ✅ Ready with proper Facebook OAuth configuration

### Security Features Implemented

1. **Facebook OAuth** - Secure third-party authentication via Passport.js
2. **Session Management** - Express session with configurable duration (default 7 days), httpOnly cookies
3. **User Data Isolation** - All data operations filter by userId
4. **CORS Protection** - Only allows configured origins
5. **Rate Limiting** - Prevents API abuse
6. **Input Validation** - All API inputs validated
7. **Secure Headers** - Proper security headers configured
8. **Ownership Verification** - DELETE operations verify entry belongs to user

### Authentication Details

- **Provider:** Facebook OAuth via Passport.js
- **Flow:** Server-side OAuth (not client-side JavaScript SDK)
- **Session:** Express session with MemoryStore (development), configurable expiration via SESSION_EXPIRE_DAYS
- **Cookie:** httpOnly, sameSite=lax, secure=false (HTTP/localhost)
- **Permissions:** public_profile (basic user info, no app review needed)
- **User ID Format:** `facebook:{facebookId}` (e.g., "facebook:123456789")

### Data Migration

- First user to login gets all existing entries migrated to their account
- Server logs: `"Migrating existing data to user: facebook:..."`
- Subsequent users start with empty lists
- Data is fully isolated between users

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

## Stock Addition History

The app tracks stock addition history with cost and shop information for expense tracking and inventory management.

### Data Storage

- **File:** `data/stock-history.json`
- **Structure:** `{"additions": [entry1, entry2, ...]}`
- **Each entry contains:** `id`, `userId`, `brand`, `beanName`, `quantity`, `cost`, `shop`, `timestamp`

### API Endpoints

- **GET `/api/stock-history`** - Get authenticated user's addition history (optional `?limit=N` for pagination)
- **POST `/api/stock`** - Add stock (now **requires** `cost` and `shop` fields)

### Type Definitions

- **`StockAddHistory`** - Type for addition history entries
- **Location:** `src/features/coffee-tracker/types/CoffeeEntry.types.ts`
- **Zod schema** validates all fields including cost (nonnegative) and shop (non-empty string)

### Frontend Components

- **AddStockDialog** - Now requires users to enter:
  - Quantity (number of capsules, 1-1000)
  - Total Cost (e.g., 25.00)
  - Shop Name (e.g., "Amazon", "Local Store")

### Backend Behavior

When stock is added:
1. Validates all inputs (quantity, cost, shop)
2. Updates `CoffeeStock` quantity
3. Creates `StockAddHistory` entry
4. Saves to both `stock-data.json` and `stock-history.json`

### Usage Notes

- **cost and shop are required** - Stock addition will fail without these fields
- **cost allows 0** - Supports free stock/gift scenarios
- **History is user-isolated** - Each user only sees their own addition history
- **Sorted by newest first** - GET endpoint returns most recent additions first

## Future Improvements

### High Priority

- [x] Add authentication (✅ Facebook OAuth implemented)
- [ ] Migrate from file-based storage to SQLite/PostgreSQL
- [ ] Add automated tests

### Medium Priority

- [ ] Add automated tests
- [ ] Add error boundaries
- [ ] Implement user profile management

### Low Priority

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

## Stock Addition History

The app tracks stock addition history with cost and shop information for expense tracking and inventory management.

### Data Storage

- **File:** `data/stock-history.json`
- **Structure:** `{"additions": [entry1, entry2, ...]}`
- **Each entry contains:** `id`, `userId`, `brand`, `beanName`, `quantity`, `cost`, `shop`, `timestamp`

### API Endpoints

- **GET `/api/stock-history`** - Get authenticated user's addition history (optional `?limit=N` for pagination)
- **POST `/api/stock`** - Add stock (now **requires** `cost` and `shop` fields)

### Type Definitions

- **`StockAddHistory`** - Type for addition history entries
- **Location:** `src/features/coffee-tracker/types/CoffeeEntry.types.ts`
- **Zod schema** validates all fields including cost (nonnegative) and shop (non-empty string)

### Frontend Components

- **AddStockDialog** - Now requires users to enter:
  - Quantity (number of capsules, 1-1000)
  - Total Cost (e.g., 25.00)
  - Shop Name (e.g., "Amazon", "Local Store")

### Backend Behavior

When stock is added:
1. Validates all inputs (quantity, cost, shop)
2. Updates `CoffeeStock` quantity
3. Creates `StockAddHistory` entry
4. Saves to both `stock-data.json` and `stock-history.json`

### Usage Notes

- **cost and shop are required** - Stock addition will fail without these fields
- **cost allows 0** - Supports free stock/gift scenarios
- **History is user-isolated** - Each user only sees their own addition history
- **Sorted by newest first** - GET endpoint returns most recent additions first

## Future Improvements

### High Priority

- [x] Add authentication (✅ Facebook OAuth implemented)
- [ ] Migrate from file-based storage to SQLite/PostgreSQL
- [ ] Add automated tests

### Medium Priority

- [ ] Add automated tests
- [ ] Add error boundaries
- [ ] Implement user profile management

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

**Last Updated:** 2026-03-21
**Version:** 1.5.0 (with Facebook Authentication)
**Maintained By:** Project Owner
