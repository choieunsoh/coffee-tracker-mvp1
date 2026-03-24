# Stock Tracking Feature Design

**Date:** 2026-03-24
**Status:** Approved
**Approach:** Separate Stock Data File with Backend Endpoints

## Overview

Add coffee capsule stock tracking to the Coffee Tracker MVP. Users can add capsule inventory via a FAB button, and stock automatically decreases when logging coffee consumption. When stock reaches zero, adding coffee is blocked until more capsules are added.

**Implementation Scope:**
- **Phase 1 (This spec):** Single coffee type using `DEFAULT_COFFEE_TYPE` (Starbucks/House Blend)
- **Phase 2 (Future):** Multi-type support with coffee type selection/management

This spec focuses on Phase 1, with data structures designed to be extensible for Phase 2.

## Requirements

### Functional Requirements

1. **Per-coffee-type stock tracking** - Stock tracked separately for each brand/beanName combination
2. **Add stock via FAB button** - Floating action button opens dialog to input quantity
3. **Dedicated stock display** - StockCard component shows current quantity prominently
4. **Auto-decrement on consume** - Stock decreases by 1 when logging a coffee entry
5. **Block at zero** - Prevent adding coffee entries when stock = 0
6. **User isolation** - Each user has their own stock inventory

### Non-Functional Requirements

- Type `interface` → use `type` instead
- Time format: HH:mm:ss local time
- Follow existing code patterns (custom hooks, feature-based organization)
- Maintain file-based storage architecture

## Data Model

### Stock Data Storage

**File:** `data/stock-data.json`

```json
{
  "stocks": [
    {
      "id": "uuid-1",
      "userId": "facebook:123",
      "brand": "Starbucks",
      "beanName": "House Blend",
      "quantity": 12,
      "createdAt": 1648000000000,
      "updatedAt": 1648000000000
    }
  ]
}
```

### TypeScript Types

**File:** `src/features/coffee-tracker/types/CoffeeEntry.types.ts`

```typescript
export const CoffeeStockSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  brand: z.string().min(1),
  beanName: z.string().min(1),
  quantity: z.number().int().min(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export type CoffeeStock = z.infer<typeof CoffeeStockSchema>
```

## API Endpoints

### Backend Routes (server.js)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/stock` | GET | Get current stock for user | ✓ |
| `/api/stock` | POST | Add/update stock | ✓ |
| `/api/stock/consume` | POST | Decrease stock by 1 | ✓ |
| `/api/stock` | PATCH | Manually adjust stock (future) | ✓ |
| `/api/stock/:id` | DELETE | Remove stock entry (future) | ✓ |

### Request/Response Formats

**GET `/api/stock`**
- Response: `CoffeeStock[]`

**POST `/api/stock`**
- Request: `{ brand: string, beanName: string, quantity: number }`
- Response: `CoffeeStock`
- Behavior: Creates new stock or updates existing if same coffee type

**POST `/api/stock/consume`**
- Request: `{ brand: string, beanName: string }`
- Response: `{ success: true, remaining: number }`
- Error: `{ error: "Insufficient stock" }` if quantity < 1

### API Client Methods

**File:** `src/lib/api/client.ts`

Add these methods to the existing `CoffeeApiClient` class:

```typescript
// In src/lib/api/client.ts
export class CoffeeApiClient {
  // ... existing methods (getTodayEntries, addEntry, updateEntry, deleteEntry) ...

  async getStock(): Promise<CoffeeStock[]> {
    const response = await this.fetch('/api/stock', { method: 'GET' })
    return handleResponse(response)
  }

  async addStock(brand: string, beanName: string, quantity: number): Promise<CoffeeStock> {
    const response = await this.fetch('/api/stock', {
      method: 'POST',
      body: JSON.stringify({ brand, beanName, quantity }),
    })
    return handleResponse(response)
  }

  async consumeStock(brand: string, beanName: string): Promise<{success: boolean, remaining: number}> {
    const response = await this.fetch('/api/stock/consume', {
      method: 'POST',
      body: JSON.stringify({ brand, beanName }),
    })
    return handleResponse(response)
  }
}
```

**Implementation Note:** For Phase 1, `brand` and `beanName` parameters are derived from `DEFAULT_COFFEE_TYPE` in `src/config/app.config.ts`.

## Frontend Components

### Component Structure

```
src/features/coffee-tracker/
├── components/
│   ├── StockCard.tsx          # NEW: Stock display card
│   ├── AddStockDialog.tsx     # NEW: Dialog for adding stock
│   ├── AddStockFAB.tsx        # NEW: Floating action button
│   ├── CoffeeCountButton.tsx  # MODIFIED: Check stock before enable
│   └── CoffeeTracker.tsx      # MODIFIED: Add stock components
├── hooks/
│   └── useStock.ts            # NEW: Stock state management
└── types/
    └── CoffeeEntry.types.ts   # MODIFIED: Add CoffeeStock type
```

### Component Specifications

#### StockCard.tsx

Displays current stock with color-coded status:

```typescript
type StockCardProps = {
  stock: CoffeeStock | null
  isLoading: boolean
}
```

**Features:**
- Large quantity display
- Color coding: green (10+), yellow (3-9), red (0-2)
- "Low stock!" warning when quantity ≤ 2
- Shows coffee type name (e.g., "Starbucks House Blend")
- Empty state when no stock exists: "No capsule stock. Add capsules to get started."

#### AddStockDialog.tsx

Dialog for adding stock quantity:

```typescript
type AddStockDialogProps = {
  open: boolean
  onClose: () => void
  onAdd: (quantity: number) => Promise<void>
}
```

**Features:**
- MUI Dialog component
- Number input (min: 1, max: 1000)
- "Add" and "Cancel" buttons
- Validation before submit
- For Phase 1: Uses `DEFAULT_COFFEE_TYPE` internally (brand/beanName from config)

**Implementation Note:** The dialog only accepts quantity because the coffee type is fixed to `DEFAULT_COFFEE_TYPE`. For Phase 2, this will be updated to include coffee type selection.

#### AddStockFAB.tsx

Floating action button:

**Features:**
- Positioned bottom-right
- Opens AddStockDialog on click
- MUI FAB with add icon

#### useStock.ts

Custom hook for stock logic:

```typescript
type UseStockReturn = {
  stock: CoffeeStock | null
  isLoading: boolean
  isAdding: boolean
  error: string | null
  addStock: (quantity: number) => Promise<void>
  consumeStock: () => Promise<boolean>  // Phase 1: no params needed
  refreshStock: () => Promise<void>
}
```

**Implementation Note:** For Phase 1, `consumeStock()` takes no parameters and uses `DEFAULT_COFFEE_TYPE` internally. For Phase 2, this will accept `(brand: string, beanName: string)` parameters.

### Layout in CoffeeTracker.tsx

```
┌─────────────────────────────────────┐
│         StockCard                    │  NEW: Stock display
│      12 capsules remaining           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        ☕  5                         │  Existing: Coffee button
│    coffees today                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Today's Entries List              │  Existing: Entries
└─────────────────────────────────────┘

                                    +     NEW: FAB (bottom-right)
```

## Data Flow

### Adding Coffee Entry (with stock decrease)

1. User clicks CoffeeCountButton
2. `useCoffeeEntries.addEntry()` calls `useStock.consumeStock()`
   - For Phase 1: Uses `DEFAULT_COFFEE_TYPE` (Starbucks/House Blend)
3. Backend: POST `/api/stock/consume` with brand/beanName
4. If success: POST `/api/entries` creates entry
5. If fail (stock < 1): Entry creation blocked, error shown

### Stock Initialization (First-Time User)

**Scenario:** New user logs in, no stock entry exists

1. StockCard shows empty state: "No capsule stock. Add capsules to get started."
2. CoffeeCountButton is disabled with tooltip: "Add stock before logging coffee"
3. User clicks FAB → AddStockDialog → Enters quantity → Stock initialized
4. After stock added, CoffeeCountButton becomes enabled

### Adding Stock

1. User clicks AddStockFAB
2. AddStockDialog opens
3. User enters quantity and clicks Add
4. Backend: POST `/api/stock`
5. StockCard auto-updates with new quantity

## Error Handling

### Error Messages

```typescript
const ERROR_MESSAGES = {
  NO_STOCK: "No capsules remaining. Add more stock to continue.",
  INSUFFICIENT_STOCK: "Not enough capsules in stock.",
  NO_STOCK_ENTRY: "No stock found for this coffee type. Please add stock first.",
  NETWORK_ERROR: "Connection error. Please check your internet.",
  INVALID_QUANTITY: "Please enter a valid number (1-1000).",
  ADD_FAILED: "Failed to add stock. Please try again.",
}
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Stock = 0 | CoffeeCountButton disabled with tooltip "No capsules remaining. Add more stock to continue." |
| Stock = 1-2 | Yellow color + "Low stock!" warning |
| No stock entry (new user) | StockCard shows empty state, CoffeeCountButton disabled with "Add stock before logging coffee" |
| Add stock with existing | Updates existing entry (adds quantity) rather than creating duplicate |
| Consume with no stock entry | Error: "No stock found for this coffee type. Please add stock first." |
| Delete entry | Does NOT restore stock (capsule already consumed) |
| API failure | User-friendly error message shown in StockCard |
| Invalid input | Dialog validation rejects (negative, empty, >1000) |
| First-time user | Empty state message guides them to add stock via FAB |

## Testing Strategy

### Manual Testing Checklist

**Stock Display:**
- [ ] StockCard shows correct quantity
- [ ] Color coding works (green/yellow/red)
- [ ] "Low stock!" appears at ≤ 2
- [ ] Loading state displays

**Adding Stock:**
- [ ] FAB opens dialog
- [ ] Input validation works
- [ ] Stock adds successfully
- [ ] StockCard updates immediately

**Consuming Stock:**
- [ ] Stock decreases when adding coffee
- [ ] Button disabled at stock = 0
- [ ] Entry blocked when insufficient stock
- [ ] Error shown on failure

**Edge Cases:**
- [ ] Adding to existing stock updates (no duplicates)
- [ ] No stock entry handled gracefully
- [ ] API errors show messages
- [ ] Delete doesn't restore stock

## Implementation Notes

### Key Design Decisions

1. **Separate stock file** - Clean separation of concerns, easier to manage
2. **Dedicated consume endpoint** - Clear responsibility boundaries, atomic operation
3. **Hard block at zero** - Enforces inventory discipline
4. **No restore on delete** - Accurate real-world modeling (capsule consumed is gone)
5. **Phase 1: Single coffee type** - Uses `DEFAULT_COFFEE_TYPE` for simplicity
6. **Extensible data model** - Designed for Phase 2 multi-type support (stock tracked per brand/beanName)

### Phase 1 vs Phase 2

| Aspect | Phase 1 (This spec) | Phase 2 (Future) |
|--------|---------------------|------------------|
| Coffee types | Single (DEFAULT_COFFEE_TYPE) | Multiple, user-managed |
| Stock dialog | Quantity input only | Quantity + coffee type selector |
| consumeStock() | No params (uses default) | Accepts brand/beanName params |
| Stock display | Single StockCard | StockCard with type tabs or list |
| Type management | None (fixed to config) | Add/edit/delete coffee types |

### Code Style

- **Use `type` not `interface`** - All TypeScript type definitions use the `type` keyword (project preference)
- Follow existing patterns from `useCoffeeEntries` hook
- Feature-based component organization
- Zod validation for all types
- Atomic operations in backend (read-modify-write in one sequence)

## Future Enhancements

- [ ] Stock history/logs
- [ ] Low stock alerts
- [ ] Multiple storage locations
- [ ] Expiry date tracking
- [ ] Stock charts/analytics
- [ ] Bulk import stock
