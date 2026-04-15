# Stock Addition History Design

**Date:** 2026-04-15
**Status:** Approved
**Approach:** Backend-Only (UI deferred)

## Overview

Add a stock addition history log that records each time a user adds coffee capsules to their inventory. Each entry captures:
- When the addition happened
- How many capsules were added
- Total cost
- Which shop/where it was purchased
- Which user made the addition

The history is stored separately from the current stock state, creating an audit trail for expense tracking and inventory management.

## Scope

**Phase 1 (This spec):** Backend implementation
- Data storage structure
- API endpoints
- Type definitions
- Integration with existing `/api/stock` endpoint

**Phase 2 (Future):** UI to view history
- History display dialog
- Filtering and sorting options
- Cost analytics

## Data Model

### Storage File

**File:** `data/stock-history.json`

```json
{
  "additions": [
    {
      "id": "uuid-v4",
      "userId": "facebook:123456789",
      "brand": "Starbucks",
      "beanName": "House Blend",
      "quantity": 50,
      "cost": 25.00,
      "shop": "Amazon",
      "timestamp": 1774345423839
    }
  ]
}
```

### Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier for this history entry |
| `userId` | string | User who made the addition |
| `brand` | string | Coffee brand |
| `beanName` | string | Coffee bean name |
| `quantity` | number (int, positive) | Number of capsules added |
| `cost` | number (nonnegative) | Total cost (e.g., 25.00 for $25) |
| `shop` | string | Where purchased (e.g., "Amazon", "Local Store") |
| `timestamp` | number (Unix ms) | When the addition occurred |

### TypeScript Types

**File:** `src/features/coffee-tracker/types/CoffeeEntry.types.ts`

```typescript
export const StockAddHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  brand: z.string().min(1),
  beanName: z.string().min(1),
  quantity: z.number().int().positive(),
  cost: z.number().nonnegative(),
  shop: z.string().min(1),
  timestamp: z.number().int().positive(),
})

export type StockAddHistory = z.infer<typeof StockAddHistorySchema>
```

## API Endpoints

### New Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/stock-history` | GET | Get addition history for authenticated user | ✓ |
| `/api/stock-history` | POST | Create new history entry (internal use) | ✓ |

### GET `/api/stock-history`

**Query Parameters:**
- `limit` (optional): Number of entries to return (e.g., `?limit=10`)

**Response:** `StockAddHistory[]`

**Behavior:**
- Reads `data/stock-history.json`
- Filters entries by authenticated user's `userId`
- Sorts by `timestamp` descending (newest first)
- Returns filtered array (limited if `limit` provided)

### POST `/api/stock-history`

**Request Body:**
```typescript
{
  brand: string
  beanName: string
  quantity: number
  cost: number
  shop: string
}
```

**Response:** `StockAddHistory` (the created entry)

**Behavior:**
- Generates new UUID for `id`
- Sets `userId` from authenticated session
- Sets `timestamp` to `Date.now()`
- Appends to `data/stock-history.json`
- Returns created entry

### Modified Endpoint

**POST `/api/stock`** - Extended to require history logging

**New Required Fields:**
```typescript
{
  brand: string
  beanName: string
  quantity: number
  cost: number     // NEW: Required
  shop: string     // NEW: Required
}
```

**Updated Behavior:**
1. Validate `cost` >= 0 and `shop` is not empty
2. Update `CoffeeStock` (existing behavior)
3. Create `StockAddHistory` entry
4. Save to `data/stock-history.json`

## Backend Flow

### Adding Stock with History

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ADDS STOCK                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Frontend calls: apiClient.addStock(brand, beanName,      │
│    quantity, cost, shop)                                    │
│                                                             │
│ 2. Server: POST /api/stock                                  │
│    │                                                         │
│    ├─► Update CoffeeStock.quantity += quantity              │
│    │   (or create new if doesn't exist)                     │
│    │   CoffeeStock.updatedAt = Date.now()                   │
│    │                                                         │
│    ├─► Create StockAddHistory entry (cost + shop required) │
│    │   Save to data/stock-history.json                      │
│    │                                                         │
│    └─► Response: Updated CoffeeStock                        │
│                                                             │
│ 3. Frontend updates StockCard display                       │
└─────────────────────────────────────────────────────────────┘
```

### Fetching History (Future UI)

```
GET /api/stock-history
→ Server reads data/stock-history.json
→ Filters additions by userId
→ Sorts by timestamp descending
→ Returns filtered array
```

## API Client Updates

**File:** `src/lib/api/client.ts`

### New Method

```typescript
async getStockHistory(limit?: number): Promise<StockAddHistory[]> {
  const url = limit ? `/api/stock-history?limit=${limit}` : '/api/stock-history'
  const response = await this.fetch(url, { method: 'GET' })
  return handleResponse(response)
}
```

### Modified Method

```typescript
async addStock(
  brand: string,
  beanName: string,
  quantity: number,
  cost: number,      // NEW: Required
  shop: string       // NEW: Required
): Promise<CoffeeStock> {
  const response = await this.fetch('/api/stock', {
    method: 'POST',
    body: JSON.stringify({ brand, beanName, quantity, cost, shop }),
  })
  return handleResponse(response)
}
```

## Error Handling

### Error Cases

| Scenario | Error Response |
|----------|----------------|
| Missing `cost` | `{ error: "Cost is required" }` |
| Missing `shop` | `{ error: "Shop name is required" }` |
| Invalid `cost` (negative) | `{ error: "Cost cannot be negative" }` |
| Empty `shop` string | `{ error: "Shop name cannot be empty" }` |
| History file missing | Create file with empty `additions` array |
| File read error | `{ error: "Failed to read stock history" }` |

### Validation Rules

- `cost` is required (allows 0 for free stock)
- `shop` is required and cannot be empty
- `cost` must be >= 0
- History entry is ALWAYS created when adding stock (cost + shop are required)

## Testing Strategy

### Manual Testing Checklist

**Backend:**
- [ ] POST `/api/stock` with cost+shop creates history entry
- [ ] POST `/api/stock` without cost returns error
- [ ] POST `/api/stock` without shop returns error
- [ ] GET `/api/stock-history` returns only user's entries
- [ ] GET `/api/stock-history?limit=5` returns 5 most recent
- [ ] Entries sorted by timestamp descending
- [ ] Invalid cost (negative) returns error
- [ ] Empty shop returns error

**Integration:**
- [ ] Stock quantity updates correctly
- [ ] History file created if missing
- [ ] Multiple users don't see each other's history

## Future Enhancements

**Phase 2 - UI:**
- [ ] History view dialog in StockCard
- [ ] Filter by date range
- [ ] Filter by shop
- [ ] Total cost calculation
- [ ] Cost per capsule analytics

**Phase 3 - Advanced:**
- [ ] Edit/delete history entries
- [ ] Export history as CSV
- [ ] Cost charts and trends
- [ ] Low stock alerts based on consumption rate

## Implementation Notes

### Key Design Decisions

1. **Separate history file** - Clean separation, easier to manage, doesn't bloat stock-data.json
2. **cost + shop are required** - Ensures complete history data for every stock addition
3. **Brand/beanName stored** - Future-proof for Phase 2 multi-coffee-type support
4. **Backend-only for now** - Data structure ready, UI can be added when needed
5. **cost allows 0** - Supports free stock/gift scenarios
6. **Breaking change** - Existing `addStock` calls must now include cost + shop (UI will need updating)

### Code Style

- Use `type` not `interface` (project preference)
- Zod validation for all types
- Follow existing error handling patterns
- Maintain file-based storage architecture

## Dependencies

- Existing: `CoffeeStock` type, `POST /api/stock` endpoint
- New: `StockAddHistory` type, `stock-history.json` file, `/api/stock-history` endpoints
