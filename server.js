import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import fs from 'fs';
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileSessionStore } from './lib/FileSessionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = 5001;
// Store database in /app/data directory (persisted to local machine)
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'coffee-data.json');
const STOCK_DB_FILE = path.join(DATA_DIR, 'stock-data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
// CORS configuration - restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:5001'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  }),
);

app.use(express.json());
app.use(express.static('dist'));

// Rate limiting to prevent API abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for static files
    return req.path.startsWith('/assets') || req.path.startsWith('/favicon');
  },
});

// Apply rate limiting to API routes only
app.use('/api/', apiLimiter);

// ============================================
// Session & Authentication Middleware
// ============================================

// Session configuration (must be before Passport)
const sessionExpireDays = parseInt(process.env.SESSION_EXPIRE_DAYS || '7', 10);

// Ensure sessions directory exists
const SESSION_DIR = path.join(DATA_DIR, 'sessions');
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'coffee-tracker-secret-change-in-production',
    resave: false,
    saveUninitialized: true, // Change to true to ensure session is saved
    rolling: false, // Don't reset session maxAge on every request
    store: new FileSessionStore({
      path: SESSION_DIR, // Store sessions in data/sessions directory
    }),
    cookie: {
      secure: false, // MUST be false for localhost/HTTP
      sameSite: 'lax', // CSRF protection
      maxAge: sessionExpireDays * 24 * 60 * 60 * 1000, // Configurable (default: 7 days)
      httpOnly: true, // Prevent XSS
      domain: undefined, // Let browser determine domain (works for localhost)
      path: '/', // Ensure cookie is available for all paths
    },
    name: 'coffee.sid', // Explicit session cookie name
  }),
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName'],
    },
    function (accessToken, refreshToken, profile, done) {
      // Create user object from Facebook profile
      const user = {
        facebookId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        provider: 'facebook',
      };
      return done(null, user);
    },
  ),
);

// Serialize/deserialize user for session
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ============================================
// Authentication Routes
// ============================================

// Start Facebook OAuth flow
app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile'] }));

// Facebook OAuth callback
app.get('/api/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  // Successful authentication - migrate data if needed, then redirect
  console.log('OAuth callback successful, user:', req.user);
  if (req.user && req.user.facebookId) {
    migrateDataToUser(`facebook:${req.user.facebookId}`);
  }

  // Save session before redirecting
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
    }
    console.log('Session saved, redirecting to /');
    res.redirect('/');
  });
});

// Get current user info
app.get('/api/auth/me', (req, res) => {
  console.log('/api/auth/me - isAuthenticated:', req.isAuthenticated(), 'session:', req.sessionID, 'user:', req.user);
  if (!req.isAuthenticated() || !req.user) {
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

// ============================================
// Authentication Middleware
// ============================================

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Helper function to get user ID from request
const getUserId = (req) => {
  return req.user?.facebookId ? `facebook:${req.user.facebookId}` : null;
};

// ============================================
// API Routes
// ============================================

// API Routes
app.get('/api/entries', requireAuth, (req, res) => {
  try {
    const { startDate } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Validate startDate parameter
    if (startDate !== undefined) {
      const parsedDate = parseInt(startDate);
      if (isNaN(parsedDate)) {
        return res.status(400).json({ error: 'Invalid startDate: must be a number' });
      }
      if (parsedDate < 0) {
        return res.status(400).json({ error: 'Invalid startDate: must be positive' });
      }
    }

    const data = readDatabase();
    const todayEntries = startDate ? getEntriesSince(data, parseInt(startDate), userId) : getTodayEntries(data, userId);
    res.json(todayEntries);
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/entries', requireAuth, (req, res) => {
  try {
    const { brand, beanName } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate brand if provided
    if (brand !== undefined && brand !== null) {
      if (typeof brand !== 'string') {
        return res.status(400).json({ error: 'Invalid brand: must be a string' });
      }
      if (brand.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid brand: cannot be empty' });
      }
      if (brand.length > 100) {
        return res.status(400).json({ error: 'Invalid brand: too long (max 100 characters)' });
      }
    }

    // Validate beanName if provided
    if (beanName !== undefined && beanName !== null) {
      if (typeof beanName !== 'string') {
        return res.status(400).json({ error: 'Invalid beanName: must be a string' });
      }
      if (beanName.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid beanName: cannot be empty' });
      }
      if (beanName.length > 100) {
        return res.status(400).json({ error: 'Invalid beanName: too long (max 100 characters)' });
      }
    }

    const newEntry = {
      id: crypto.randomUUID(),
      userId, // NEW: Associate with user
      brand: brand?.trim() || 'Starbucks',
      beanName: beanName?.trim() || 'House Blend',
      createdAt: Date.now(),
    };

    const data = readDatabase();
    data.unshift(newEntry);
    writeDatabase(data);

    res.json(newEntry);
  } catch (error) {
    console.error('Failed to add entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/entries/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Validate id parameter
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id: must be a string' });
    }
    if (id.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid id: cannot be empty' });
    }

    // Check if entry exists and belongs to user
    const data = readDatabase();
    const entry = data.find((entry) => entry.id === id);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Entry belongs to another user' });
    }

    const filtered = data.filter((entry) => entry.id !== id);
    writeDatabase(filtered);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH endpoint to update entry timestamp
app.patch('/api/entries/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { createdAt } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Validate id parameter
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id: must be a string' });
    }
    if (id.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid id: cannot be empty' });
    }

    // Validate createdAt parameter
    if (createdAt === undefined || typeof createdAt !== 'number') {
      return res.status(400).json({ error: 'Invalid createdAt: must be a number' });
    }

    // Check if entry exists and belongs to user
    const data = readDatabase();
    const entryIndex = data.findIndex((entry) => entry.id === id);

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (data[entryIndex].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Entry belongs to another user' });
    }

    // Update the timestamp
    data[entryIndex].createdAt = createdAt;
    writeDatabase(data);

    res.json({ success: true, entry: data[entryIndex] });
  } catch (error) {
    console.error('Failed to update entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stock - Get user's stock
app.get('/api/stock', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const data = readStockDatabase();
    const userStocks = data.stocks.filter(s => s.userId === userId);
    res.json(userStocks);
  } catch (error) {
    console.error('Failed to fetch stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock - Add or update stock
app.post('/api/stock', requireAuth, (req, res) => {
  try {
    const { brand, beanName, quantity } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate brand
    if (typeof brand !== 'string') {
      return res.status(400).json({ error: 'Invalid brand: must be a string' });
    }
    if (brand.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid brand: cannot be empty' });
    }
    if (brand.length > 100) {
      return res.status(400).json({ error: 'Invalid brand: too long (max 100 characters)' });
    }

    // Validate beanName
    if (typeof beanName !== 'string') {
      return res.status(400).json({ error: 'Invalid beanName: must be a string' });
    }
    if (beanName.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid beanName: cannot be empty' });
    }
    if (beanName.length > 100) {
      return res.status(400).json({ error: 'Invalid beanName: too long (max 100 characters)' });
    }

    // Validate quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      return res.status(400).json({ error: 'Invalid quantity: must be integer between 1 and 1000' });
    }

    const trimmedBrand = brand.trim();
    const trimmedBeanName = beanName.trim();

    const data = readStockDatabase();
    const existingStock = findStock(data.stocks, userId, trimmedBrand, trimmedBeanName);

    if (existingStock) {
      // Update existing stock
      existingStock.quantity += quantity;
      existingStock.updatedAt = Date.now();
      writeStockDatabase(data);
      res.json(existingStock);
    } else {
      // Create new stock entry
      const newStock = {
        id: crypto.randomUUID(),
        userId,
        brand: trimmedBrand,
        beanName: trimmedBeanName,
        quantity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      data.stocks.push(newStock);
      writeStockDatabase(data);
      res.json(newStock);
    }
  } catch (error) {
    console.error('Failed to add stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock/consume - Decrease stock by 1
app.post('/api/stock/consume', requireAuth, (req, res) => {
  try {
    const { brand, beanName } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate brand
    if (typeof brand !== 'string') {
      return res.status(400).json({ error: 'Invalid brand: must be a string' });
    }
    if (brand.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid brand: cannot be empty' });
    }
    if (brand.length > 100) {
      return res.status(400).json({ error: 'Invalid brand: too long (max 100 characters)' });
    }

    // Validate beanName
    if (typeof beanName !== 'string') {
      return res.status(400).json({ error: 'Invalid beanName: must be a string' });
    }
    if (beanName.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid beanName: cannot be empty' });
    }
    if (beanName.length > 100) {
      return res.status(400).json({ error: 'Invalid beanName: too long (max 100 characters)' });
    }

    const trimmedBrand = brand.trim();
    const trimmedBeanName = beanName.trim();

    const data = readStockDatabase();
    const stock = findStock(data.stocks, userId, trimmedBrand, trimmedBeanName);

    if (!stock) {
      return res.status(404).json({ error: 'No stock found for this coffee type. Please add stock first.' });
    }

    if (stock.quantity < 1) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Decrease stock
    stock.quantity -= 1;
    stock.updatedAt = Date.now();
    writeStockDatabase(data);

    res.json({ success: true, remaining: stock.quantity });
  } catch (error) {
    console.error('Failed to consume stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock/restore - Increase stock by 1 (restore after delete)
app.post('/api/stock/restore', requireAuth, (req, res) => {
  try {
    const { brand, beanName } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate brand
    if (typeof brand !== 'string') {
      return res.status(400).json({ error: 'Invalid brand: must be a string' });
    }
    if (brand.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid brand: cannot be empty' });
    }
    if (brand.length > 100) {
      return res.status(400).json({ error: 'Invalid brand: too long (max 100 characters)' });
    }

    // Validate beanName
    if (typeof beanName !== 'string') {
      return res.status(400).json({ error: 'Invalid beanName: must be a string' });
    }
    if (beanName.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid beanName: cannot be empty' });
    }
    if (beanName.length > 100) {
      return res.status(400).json({ error: 'Invalid beanName: too long (max 100 characters)' });
    }

    const trimmedBrand = brand.trim();
    const trimmedBeanName = beanName.trim();

    const data = readStockDatabase();
    const stock = findStock(data.stocks, userId, trimmedBrand, trimmedBeanName);

    if (!stock) {
      return res.status(404).json({ error: 'No stock found for this coffee type. Please add stock first.' });
    }

    // Increase stock (restore)
    stock.quantity += 1;
    stock.updatedAt = Date.now();
    writeStockDatabase(data);

    res.json({ success: true, remaining: stock.quantity });
  } catch (error) {
    console.error('Failed to restore stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Database functions
function readDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getTodayEntries(allEntries, userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return allEntries.filter((entry) => entry.createdAt >= startOfDay.getTime() && entry.userId === userId);
}

function getEntriesSince(allEntries, startDate, userId) {
  return allEntries.filter((entry) => entry.createdAt >= startDate && entry.userId === userId);
}

// Stock database functions
function readStockDatabase() {
  if (!fs.existsSync(STOCK_DB_FILE)) {
    return { stocks: [] };
  }
  try {
    const data = fs.readFileSync(STOCK_DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { stocks: [] };
  }
}

function writeStockDatabase(data) {
  fs.writeFileSync(STOCK_DB_FILE, JSON.stringify(data, null, 2));
}

function findStock(stocks, userId, brand, beanName) {
  return stocks.find(
    s => s.userId === userId && s.brand === brand && s.beanName === beanName
  );
}

// Migrate existing data to first user on first login
function migrateDataToUser(userId) {
  const data = readDatabase();

  // Check if migration needed (entries without userId)
  const needsMigration = data.some((entry) => !entry.userId);

  if (needsMigration) {
    console.log('Migrating existing data to user:', userId);
    const migratedData = data.map((entry) => ({
      ...entry,
      userId: entry.userId || userId,
    }));
    writeDatabase(migratedData);
    console.log('Migration complete. Migrated', data.length, 'entries.');
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Coffee Tracker server running on http://0.0.0.0:${PORT}`);
});
