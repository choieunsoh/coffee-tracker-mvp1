import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = 5001;
// Store database in /app/data directory (persisted to local machine)
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'coffee-data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
// CORS configuration - restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:5001'];

app.use(cors({
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
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.static('dist'));

// API Routes
app.get('/api/entries', (req, res) => {
  try {
    const { startDate } = req.query;

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
    const todayEntries = startDate
      ? getEntriesSince(data, parseInt(startDate))
      : getTodayEntries(data);
    res.json(todayEntries);
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/entries', (req, res) => {
  try {
    const { brand, beanName } = req.body;

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
      brand: brand?.trim() || 'Starbucks',
      beanName: beanName?.trim() || 'House Blend',
      createdAt: Date.now()
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

app.delete('/api/entries/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Validate id parameter
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id: must be a string' });
    }
    if (id.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid id: cannot be empty' });
    }

    // Check if entry exists
    const data = readDatabase();
    const entryExists = data.some(entry => entry.id === id);
    if (!entryExists) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const filtered = data.filter(entry => entry.id !== id);
    writeDatabase(filtered);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete entry:', error);
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

function getTodayEntries(allEntries) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return allEntries.filter(entry => entry.createdAt >= startOfDay.getTime());
}

function getEntriesSince(allEntries, startDate) {
  return allEntries.filter(entry => entry.createdAt >= startDate);
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Coffee Tracker server running on http://0.0.0.0:${PORT}`);
});
