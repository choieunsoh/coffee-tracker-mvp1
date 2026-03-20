# Coffee Tracker MVP - Storage Options

## Current: localStorage ✅
- **Pros:** Simple, reliable, works everywhere
- **Cons:** Browser-specific, no server sync

## Option 1: SQLite (browser-based)

To add real SQLite, install and configure:

```bash
bun add sql.js
```

Replace `Database.ts` with:
```typescript
import initSqlJs from 'sql.js';

let db: any = null;

export async function initDatabase() {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS coffee_entries (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    bean_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
}
```

## Option 2: Server-side SQLite (recommended)

For full SQLite with Drizzle ORM:
1. Move to Next.js API routes
2. Use Drizzle ORM + libsql
3. Store data on server
4. Add user authentication

## Current localStorage is perfect for MVP!
- Works offline
- Simple to use
- Easy to migrate later
