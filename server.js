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
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// API Routes
app.get('/api/entries', (req, res) => {
  try {
    const { startDate } = req.query;
    const data = readDatabase();
    const todayEntries = startDate
      ? getEntriesSince(data, parseInt(startDate))
      : getTodayEntries(data);
    res.json(todayEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.post('/api/entries', (req, res) => {
  try {
    const { brand, beanName } = req.body;
    const newEntry = {
      id: crypto.randomUUID(),
      brand: brand || 'Starbucks',
      beanName: beanName || 'House Blend',
      createdAt: Date.now()
    };

    const data = readDatabase();
    data.unshift(newEntry);
    writeDatabase(data);

    res.json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

app.delete('/api/entries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readDatabase();
    const filtered = data.filter(entry => entry.id !== id);
    writeDatabase(filtered);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
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
