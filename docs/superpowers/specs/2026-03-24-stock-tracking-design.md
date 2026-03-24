# Stock Tracking Feature Design

**Date:** 2026-03-24
**Status:** Approved
**Approach:** Separate Stock Data File with Backend Endpoints

## Overview

Add coffee capsule stock tracking to the Coffee Tracker MVP. Users can add capsule inventory via a FAB button, and stock automatically decreases when logging coffee consumption. When stock reaches zero, adding coffee is blocked until more capsules are added.

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
- Shows coffee type name

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
  consumeStock: (brand: string, beanName: string) => Promise<boolean>
  refreshStock: () => Promise<void>
}
```

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
3. Backend: POST `/api/stock/consume`
4. If success: POST `/api/entries` creates entry
5. If fail (stock < 1): Entry creation blocked, error shown

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
| Stock = 0 | CoffeeCountButton disabled with tooltip |
| Stock = 1-2 | Yellow color + "Low stock!" warning |
| Add stock with existing | Updates existing entry (adds quantity) |
| Consume with no stock entry | Error: "No stock found" |
| Delete entry | Does NOT restore stock |
| API failure | User-friendly error message |
| Invalid input | Dialog validation rejects |

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
2. **Dedicated consume endpoint** - Clear responsibility boundaries
3. **Hard block at zero** - Enforces inventory discipline
4. **No restore on delete** - Accurate real-world modeling
5. **Per-coffee-type tracking** - Extensible for multiple types

### Code Style

- Use `type` not `interface`
- Follow existing patterns from `useCoffeeEntries`
- Feature-based component organization
- Zod validation for all types

## Future Enhancements

- [ ] Stock history/logs
- [ ] Low stock alerts
- [ ] Multiple storage locations
- [ ] Expiry date tracking
- [ ] Stock charts/analytics
- [ ] Bulk import stock
