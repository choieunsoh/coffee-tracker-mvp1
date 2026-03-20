-- Coffee Entries Table
CREATE TABLE IF NOT EXISTS coffee_entries (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  bean_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Index for efficient daily queries
CREATE INDEX IF NOT EXISTS idx_coffee_entries_created_at ON coffee_entries(created_at);

-- Default coffee type configuration
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default configuration
INSERT OR IGNORE INTO config (key, value) VALUES ('default_brand', 'Starbucks');
INSERT OR IGNORE INTO config (key, value) VALUES ('default_bean_name', 'House Blend');
