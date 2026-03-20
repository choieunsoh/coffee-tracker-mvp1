# Facebook Authentication Implementation Plan

## Context

The coffee tracker app currently has no authentication - all coffee entries are stored globally and accessible by anyone. We're adding Facebook OAuth to:
- Enable multi-user support where each user has their own private coffee entries
- Migrate existing global data to the first user's account
- Require login for all app functionality (viewing and adding entries)
- Use Facebook JavaScript SDK for the OAuth flow (simpler client-side implementation)

**Implementation Date:** 2026-03-20
**Estimated Time:** ~6 hours
**Approach:** Facebook JavaScript SDK + Passport.js (server-side)

---

## Implementation Approach

### Phase 1: Setup Facebook App & Dependencies

**Step 1.1: Create Facebook App**
1. Go to https://developers.facebook.com/apps/
2. Create new app → Select "Consumer" type
3. Get App ID and App Secret
4. Configure:
   - App Domains: `localhost` for development
   - Site URL: `http://localhost:5001`
   - Valid OAuth Redirect URIs: `http://localhost:5001/api/auth/facebook/callback`

**Step 1.2: Install Dependencies**
```bash
# Backend dependencies
bun add express-session cookie-parser
bun add passport passport-facebook
bun add @types/express-session @types/cookie-parser
bun add @types/passport @types/passport-facebook

# Frontend dependencies
bun add react-facebook-login
```

**Critical Files to Modify:**
- `package.json` - Add new dependencies
- `server.js` - Add session and Passport middleware
- `src/lib/api/client.ts` - Add authentication headers

---

### Phase 2: Backend - Authentication Infrastructure

**Step 2.1: Update Database Schema**

**File:** `server.js` and `data/coffee-data.json`

Current schema:
```json
{
  "id": "uuid",
  "brand": "Starbucks",
  "beanName": "House Blend",
  "createdAt": 1234567890
}
```

New schema with user association:
```json
{
  "id": "uuid",
  "userId": "facebook:123456789",
  "brand": "Starbucks",
  "beanName": "House Blend",
  "createdAt": 1234567890
}
```

**Migration Logic:**
- On first Facebook login, detect if database is in old format (no `userId` fields)
- Assign all existing entries to the first user's Facebook ID
- Update data structure in `coffee-data.json`

**Step 2.2: Add Session & Passport Middleware**

**File:** `server.js`

Add after line 47 (after rate limiter):

```javascript
// Session configuration
import session from 'express-session';
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';

// Session middleware (must be before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Find or create user in our database
    const user = {
      facebookId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value,
      provider: 'facebook'
    };
    return done(null, user);
  }
));

// Serialize/deserialize user for session
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
```

**Step 2.3: Add OAuth Routes**

**File:** `server.js`

Add after line 70 (before existing API routes):

```javascript
// ============================================
// Authentication Routes
// ============================================

// Start Facebook OAuth flow
app.get('/api/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

// Facebook OAuth callback
app.get('/api/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/');
  }
);

// Get current user info
app.get('/api/auth/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});

// Logout
app.post('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});
```

**Step 2.4: Add Authentication Middleware**

**File:** `server.js`

Add after the auth routes:

```javascript
// Authentication middleware for API routes
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
```

**Step 2.5: Protect Existing API Routes**

**File:** `server.js`

Update existing API routes to require authentication:

Line ~80 (GET /api/entries):
```javascript
// BEFORE:
app.get('/api/entries', ...

// AFTER:
app.get('/api/entries', requireAuth, ...
```

Line ~95 (POST /api/entries):
```javascript
// BEFORE:
app.post('/api/entries', ...

// AFTER:
app.post('/api/entries', requireAuth, ...
```

Line ~115 (DELETE /api/entries/:id):
```javascript
// BEFORE:
app.delete('/api/entries/:id', ...

// AFTER:
app.delete('/api/entries/:id', requireAuth, ...
```

**Step 2.6: Update Data Access Logic**

**File:** `server.js` - Update `getTodayEntries()` and `addEntry()` functions

**Critical Change:** All data operations must filter by `userId`

```javascript
// Helper function to get user ID from request
const getUserId = (req) => {
  return req.user?.facebookId ? `facebook:${req.user.facebookId}` : null;
};

// Update getTodayEntries to filter by user
function getTodayEntries(data, userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return data.filter(entry =>
    entry.createdAt >= todayTimestamp &&
    entry.userId === userId
  );
}

// Update POST /api/entries to add userId
app.post('/api/entries', requireAuth, (req, res) => {
  try {
    const { brand, beanName } = req.body;
    const userId = getUserId(req);

    // ... existing validation ...

    const newEntry = {
      id: crypto.randomUUID(),
      userId, // NEW: Associate with user
      brand,
      beanName,
      createdAt: Date.now()
    };
    // ... rest of logic
  }
});
```

---

### Phase 3: Frontend - Authentication UI

**Step 3.1: Create Authentication Context**

**File:** `src/features/coffee-tracker/contexts/AuthContext.tsx` (NEW FILE)

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  facebookId: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = () => {
    window.location.href = '/api/auth/facebook';
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Step 3.2: Create Login Component**

**File:** `src/features/coffee-tracker/components/LoginPage.tsx` (NEW FILE)

```typescript
import React from 'react';
import { Button, Box, Typography, Container } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3
        }}
      >
        <Typography variant="h4" component="h1">
          Coffee Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your daily coffee consumption
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<FacebookIcon />}
          onClick={handleLogin}
          sx={{
            backgroundColor: '#1877F2',
            '&:hover': { backgroundColor: '#166FE5' },
            py: 1.5,
            px: 4
          }}
        >
          Continue with Facebook
        </Button>
      </Box>
    </Container>
  );
}
```

**Step 3.3: Create User Profile Component**

**File:** `src/features/coffee-tracker/components/UserProfile.tsx` (NEW FILE)

```typescript
import React from 'react';
import { Button, Box, Typography, Avatar } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export function UserProfile() {
  const { user, logout } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2
      }}
    >
      <Avatar sx={{ bgcolor: '#1877F2' }}>
        {user?.name?.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body1" fontWeight="medium">
          {user?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>
      <Button size="small" onClick={logout}>
        Logout
      </Button>
    </Box>
  );
}
```

**Step 3.4: Update App.tsx**

**File:** `src/App.tsx`

```typescript
// Add import
import { AuthProvider, useAuth } from './features/coffee-tracker/contexts/AuthContext';
import { LoginPage } from './features/coffee-tracker/components/LoginPage';
import { UserProfile } from './features/coffee-tracker/components/UserProfile';

// Wrap app with AuthProvider
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Box>
      <UserProfile />
      {/* Rest of your app */}
      <CoffeeTracker />
      {/* Footer */}
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

---

### Phase 4: Configuration & Environment Variables

**File:** `.env`

```bash
# Facebook OAuth Credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here

# Allowed CORS Origins
ALLOWED_ORIGINS=http://localhost:5001

# Environment
NODE_ENV=production
```

**File:** `.env.example`

Update to include new variables.

---

### Phase 5: Data Migration Script

**File:** `server.js` - Add on server startup

```javascript
// Migrate existing data to first user on first login
function migrateDataToUser(userId) {
  const data = readDatabase();

  // Check if migration needed (entries without userId)
  const needsMigration = data.some(entry => !entry.userId);

  if (needsMigration) {
    console.log('Migrating existing data to user:', userId);
    const migratedData = data.map(entry => ({
      ...entry,
      userId: entry.userId || userId
    }));
    writeDatabase(migratedData);
    console.log('Migration complete');
  }
}
```

Call this in the Facebook OAuth callback after successful authentication.

---

### Phase 6: Docker & Deployment Updates

**File:** `docker-compose.yml`

No changes needed - environment variables are already loaded from `.env`.

**File:** `.dockerignore`

Ensure `.env` is ignored (already done).

---

### Phase 7: Testing Checklist

**Step 7.1: Local Testing**
- [ ] Start server: `docker-compose up`
- [ ] Visit http://localhost:5001
- [ ] Verify login page shows
- [ ] Click "Continue with Facebook"
- [ ] Complete Facebook OAuth flow
- [ ] Verify redirect back to app
- [ ] Verify existing coffee entries appear (migration worked)
- [ ] Add new coffee entry
- [ ] Verify entry is saved
- [ ] Logout
- [ ] Verify login page shows again

**Step 7.2: Multi-User Testing**
- [ ] Login with Facebook account A
- [ ] Add coffee entry
- [ ] Logout
- [ ] Login with Facebook account B
- [ ] Verify you DON'T see account A's entries
- [ ] Add coffee entry for account B
- [ ] Login back to account A
- [ ] Verify you only see account A's entries

**Step 7.3: Security Testing**
- [ ] Try accessing /api/entries without login → Should get 401
- [ ] Try POST /api/entries without login → Should get 401
- [ ] Try DELETE without login → Should get 401
- [ ] Verify CORS still works

---

## Critical Files to Modify

1. **`server.js`** - Add session, Passport, auth routes, middleware
2. **`package.json`** - Add dependencies
3. **`src/lib/api/client.ts`** - No changes needed (cookies handled automatically)
4. **`src/App.tsx`** - Add AuthProvider and login check
5. **`.env`** - Add Facebook credentials
6. **`.env.example`** - Add Facebook credentials template
7. **`README.md`** - Document authentication setup
8. **`CLAUDE.md`** - Update security status

**New Files to Create:**
1. **`src/features/coffee-tracker/contexts/AuthContext.tsx`**
2. **`src/features/coffee-tracker/components/LoginPage.tsx`**
3. **`src/features/coffee-tracker/components/UserProfile.tsx`**

---

## Verification

After implementation, verify:

1. **Facebook OAuth Flow Works**
   ```bash
   # Check login endpoint redirects to Facebook
   curl -I http://localhost:5001/api/auth/facebook

   # Should return 302 redirect to Facebook
   ```

2. **Authentication Required**
   ```bash
   # Should return 401 Unauthorized
   curl http://localhost:5001/api/entries
   ```

3. **Data Isolation**
   - Login as User A → Add entry → Logout
   - Login as User B → Should NOT see User A's entry

4. **Migration Success**
   - First user should see all existing entries
   - Second user should see empty list

---

## Security Considerations

✅ **What This Provides:**
- Facebook OAuth authentication (trusted identity provider)
- Session-based authentication (secure, httpOnly cookies)
- User data isolation (each user sees only their entries)
- CSRF protection via session tokens

⚠️ **Still Missing:**
- HTTPS/TLS (required for production Facebook OAuth)
- Database migrations (manual data migration)
- User profile management
- Password recovery (handled by Facebook)

---

## Implementation Order

1. **Phase 1** - Setup (30 min): Create Facebook app, install dependencies
2. **Phase 2** - Backend (2 hours): Add session, Passport, routes, middleware
3. **Phase 3** - Frontend (1.5 hours): Create auth context, login UI, update App.tsx
4. **Phase 4** - Config (15 min): Set up environment variables
5. **Phase 5** - Migration (30 min): Implement data migration logic
6. **Phase 6** - Testing (1 hour): Test all flows
7. **Phase 7** - Documentation (30 min): Update docs

**Total Time Estimate:** ~6 hours

---

## Next Steps

Tell me which phase to implement:
- "Phase 1" - Setup Facebook App & Dependencies
- "Phase 2" - Backend Authentication Infrastructure
- "Phase 3" - Frontend Authentication UI
- "Phase 4" - Configuration Setup
- "Phase 5" - Data Migration
- "Phase 6" - Testing

I'll implement each phase step-by-step as you request.
