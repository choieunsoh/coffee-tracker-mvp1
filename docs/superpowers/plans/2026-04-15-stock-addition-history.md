# Stock Addition History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stock addition history log that records each time a user adds coffee capsules, tracking quantity, cost, shop name, and timestamp.

**Architecture:**
- Separate `data/stock-history.json` file for storage (clean separation from stock state)
- New API endpoints: GET `/api/stock-history` and modified POST `/api/stock` to require `cost` and `shop`
- New TypeScript type `StockAddHistory` with Zod validation
- Backend-only implementation (UI deferred)

**Tech Stack:**
- Node.js/Express backend with file-based JSON storage
- TypeScript frontend with Zod validation
- Existing API client pattern with `credentials: 'include'`

---

## File Structure

**Files to create:**
- `data/stock-history.json` - New storage file for addition history

**Files to modify:**
- `server.js` - Add new routes and modify existing `/api/stock` endpoint
- `src/features/coffee-tracker/types/CoffeeEntry.types.ts` - Add `StockAddHistorySchema` type
- `src/lib/api/client.ts` - Add `getStockHistory()` method and modify `addStock()` signature
- `src/features/coffee-tracker/components/AddStockDialog.tsx` - Add cost and shop input fields
- `src/features/coffee-tracker/hooks/useStock.ts` - Update `addStock()` call to include cost and shop

---

## Task 1: Add TypeScript Type for Stock Addition History

**Files:**
- Modify: `src/features/coffee-tracker/types/CoffeeEntry.types.ts`

- [ ] **Step 1: Add StockAddHistorySchema to types file**

Add after `CoffeeStockSchema` (around line 26):

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

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bun run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/features/coffee-tracker/types/CoffeeEntry.types.ts
git commit -m "feat(types): add StockAddHistory type with Zod schema"
```

---

## Task 2: Create Stock History Storage File

**Files:**
- Create: `data/stock-history.json`

- [ ] **Step 1: Create initial stock-history.json file**

Create file with empty additions array:

```json
{
  "additions": []
}
```

- [ ] **Step 2: Verify file exists**

Run: `cat data/stock-history.json`
Expected: `{"additions": []}`

- [ ] **Step 3: Commit**

```bash
git add data/stock-history.json
git commit -m "feat(data): add stock-history.json storage file"
```

---

## Task 3: Add GET /api/stock-history Endpoint

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add stock history GET route after existing stock routes**

Find the stock routes section (around line 300+) and add after the `/api/stock/consume` route:

```javascript
// GET /api/stock-history - Get user's stock addition history
app.get('/api/stock-history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    // Read stock history
    const historyData = JSON.parse(await fs.readFile(STOCK_HISTORY_PATH, 'utf8'))
    const userAdditions = historyData.additions
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp) // Newest first

    res.json(userAdditions)
  } catch (error) {
    console.error('Error reading stock history:', error)
    res.status(500).json({ error: 'Failed to read stock history' })
  }
})
```

- [ ] **Step 2: Add STOCK_HISTORY_PATH constant at top of server.js**

Find the constants section (around line 10-20) and add:

```javascript
const STOCK_HISTORY_PATH = path.join(__dirname, 'data', 'stock-history.json')
```

- [ ] **Step 3: Test the endpoint**

Run: `curl http://localhost:5001/api/stock-history -H "Cookie: connect.sid=<your-session-cookie>" -v`
Expected: `200 OK` with body `[]` (empty array)

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat(api): add GET /api/stock-history endpoint"
```

---

## Task 4: Modify POST /api/stock to Require cost and shop

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Find and update the POST /api/stock route**

Find the existing `app.post('/api/stock', ...)` route (around line 270-290) and replace the validation and history creation logic:

```javascript
// POST /api/stock - Add or update stock (now requires cost and shop)
app.post('/api/stock', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { brand, beanName, quantity, cost, shop } = req.body

    // Validation
    if (!brand || !beanName || !quantity) {
      return res.status(400).json({ error: 'Brand, beanName, and quantity are required' })
    }

    if (quantity < 1 || quantity > 1000) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 1000' })
    }

    // NEW: cost and shop are now required
    if (cost === undefined || cost === null) {
      return res.status(400).json({ error: 'Cost is required' })
    }

    if (typeof cost !== 'number' || cost < 0) {
      return res.status(400).json({ error: 'Cost must be a non-negative number' })
    }

    if (!shop || typeof shop !== 'string' || shop.trim().length === 0) {
      return res.status(400).json({ error: 'Shop name is required' })
    }

    // Read current stock data
    const stockData = JSON.parse(await fs.readFile(STOCK_DATA_PATH, 'utf8'))
    let stock = stockData.stocks.find(
      s => s.userId === userId && s.brand === brand && s.beanName === beanName
    )

    const now = Date.now()

    if (stock) {
      // Update existing stock
      stock.quantity += quantity
      stock.updatedAt = now
    } else {
      // Create new stock entry
      stock = {
        id: randomUUID(),
        userId,
        brand,
        beanName,
        quantity,
        createdAt: now,
        updatedAt: now,
      }
      stockData.stocks.push(stock)
    }

    // Write updated stock data
    await fs.writeFile(STOCK_DATA_PATH, JSON.stringify(stockData, null, 2))

    // NEW: Create history entry
    const historyEntry = {
      id: randomUUID(),
      userId,
      brand,
      beanName,
      quantity,
      cost,
      shop: shop.trim(),
      timestamp: now,
    }

    // Read and update history
    let historyData
    try {
      historyData = JSON.parse(await fs.readFile(STOCK_HISTORY_PATH, 'utf8'))
    } catch {
      // File doesn't exist yet, create it
      historyData = { additions: [] }
    }

    historyData.additions.push(historyEntry)
    await fs.writeFile(STOCK_HISTORY_PATH, JSON.stringify(historyData, null, 2))

    res.json(stock)
  } catch (error) {
    console.error('Error adding stock:', error)
    res.status(500).json({ error: 'Failed to add stock' })
  }
})
```

- [ ] **Step 2: Verify server starts without errors**

Run: `bun run start`
Expected: Server starts on port 5001, no errors

- [ ] **Step 3: Test validation - missing cost**

Run: `curl -X POST http://localhost:5001/api/stock -H "Content-Type: application/json" -H "Cookie: connect.sid=<your-session-cookie>" -d '{"brand":"Starbucks","beanName":"House Blend","quantity":10}'`
Expected: `400 Bad Request` with `{"error":"Cost is required"}`

- [ ] **Step 4: Test validation - missing shop**

Run: `curl -X POST http://localhost:5001/api/stock -H "Content-Type: application/json" -H "Cookie: connect.sid=<your-session-cookie>" -d '{"brand":"Starbucks","beanName":"House Blend","quantity":10,"cost":25}'`
Expected: `400 Bad Request` with `{"error":"Shop name is required"}`

- [ ] **Step 5: Test successful stock addition with history**

Run: `curl -X POST http://localhost:5001/api/stock -H "Content-Type: application/json" -H "Cookie: connect.sid=<your-session-cookie>" -d '{"brand":"Starbucks","beanName":"House Blend","quantity":50,"cost":25,"shop":"Amazon"}'`
Expected: `200 OK` with stock object

- [ ] **Step 6: Verify history entry was created**

Run: `cat data/stock-history.json`
Expected: Contains the addition entry with cost and shop

- [ ] **Step 7: Commit**

```bash
git add server.js data/stock-history.json
git commit -m "feat(api): require cost and shop for stock additions, create history entries"
```

---

## Task 5: Update API Client - Add getStockHistory Method

**Files:**
- Modify: `src/lib/api/client.ts`

- [ ] **Step 1: Add getStockHistory method to CoffeeApiClient class**

Find the `CoffeeApiClient` class (around line 10-50) and add after the `addStock` method:

```typescript
async getStockHistory(limit?: number): Promise<StockAddHistory[]> {
  const url = limit ? `/api/stock-history?limit=${limit}` : '/api/stock-history'
  const response = await this.fetch(url, { method: 'GET' })
  return handleResponse<StockAddHistory[]>(response)
}
```

- [ ] **Step 2: Add StockAddHistory import**

Add to the imports at the top of the file:

```typescript
import type { CoffeeEntry, NewCoffeeEntry, CoffeeStock, StockAddHistory } from '@/features/coffee-tracker/types/CoffeeEntry.types'
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `bun run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "feat(api-client): add getStockHistory method"
```

---

## Task 6: Update API Client - Modify addStock Signature

**Files:**
- Modify: `src/lib/api/client.ts`

- [ ] **Step 1: Update addStock method signature**

Find the existing `addStock` method and replace it:

```typescript
async addStock(
  brand: string,
  beanName: string,
  quantity: number,
  cost: number,
  shop: string
): Promise<CoffeeStock> {
  const response = await this.fetch('/api/stock', {
    method: 'POST',
    body: JSON.stringify({ brand, beanName, quantity, cost, shop }),
  })
  return handleResponse<CoffeeStock>(response)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bun run build`
Expected: TypeScript error in files that call `addStock()` (this is expected, we'll fix them next)

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "feat(api-client): update addStock to require cost and shop"
```

---

## Task 7: Update AddStockDialog Component - Add Cost and Shop Inputs

**Files:**
- Modify: `src/features/coffee-tracker/components/AddStockDialog.tsx`

- [ ] **Step 1: Add state for cost and shop**

Find the state declarations at the top of the component and add:

```typescript
const [cost, setCost] = useState<number>(0)
const [shop, setShop] = useState<string>('')
```

- [ ] **Step 2: Add cost and shop input fields to the dialog**

Find the quantity input field (inside the DialogContent) and add after it:

```typescript
<TextField
  autoFocus
  margin="dense"
  label="Quantity"
  type="number"
  fullWidth
  variant="outlined"
  value={quantity}
  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
  inputProps={{ min: 1, max: 1000 }}
  sx={{ mb: 2 }}
/>

{/* NEW: Cost input */}
<TextField
  margin="dense"
  label="Total Cost"
  type="number"
  fullWidth
  variant="outlined"
  value={cost || ''}
  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
  inputProps={{ min: 0, step: 0.01 }}
  sx={{ mb: 2 }}
/>

{/* NEW: Shop input */}
<TextField
  margin="dense"
  label="Shop Name"
  type="text"
  fullWidth
  variant="outlined"
  value={shop}
  onChange={(e) => setShop(e.target.value)}
  placeholder="e.g., Amazon, Local Store"
  sx={{ mb: 2 }}
/>
```

- [ ] **Step 3: Update validation to check cost and shop**

Find the validation logic in the handleAdd function and update:

```typescript
const handleAdd = async () => {
  if (quantity < 1) {
    setError('Please enter a valid quantity (1-1000)')
    return
  }

  // NEW: Validate cost
  if (cost < 0 || isNaN(cost)) {
    setError('Please enter a valid cost')
    return
  }

  // NEW: Validate shop
  if (!shop.trim()) {
    setError('Please enter a shop name')
    return
  }

  // ... rest of the function
}
```

- [ ] **Step 4: Update onAdd call to include cost and shop**

Find the `onAdd(quantity)` call and update:

```typescript
await onAdd(quantity, cost, shop.trim())
```

- [ ] **Step 5: Reset cost and shop when dialog closes**

Find the handleClose function and add:

```typescript
const handleClose = () => {
  setQuantity(1)
  setCost(0)      // NEW
  setShop('')     // NEW
  setError(null)
  onClose()
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `bun run build`
Expected: TypeScript error in useStock hook (we'll fix that next)

- [ ] **Step 7: Commit**

```bash
git add src/features/coffee-tracker/components/AddStockDialog.tsx
git commit -m "feat(dialog): add cost and shop input fields to AddStockDialog"
```

---

## Task 8: Update AddStockDialog Props Interface

**Files:**
- Modify: `src/features/coffee-tracker/components/AddStockDialog.tsx`

- [ ] **Step 1: Update AddStockDialogProps interface**

Find the props interface at the top of the file and update:

```typescript
type AddStockDialogProps = {
  open: boolean
  onClose: () => void
  onAdd: (quantity: number, cost: number, shop: string) => Promise<void>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bun run build`
Expected: TypeScript error in useStock hook (we'll fix that next)

- [ ] **Step 3: Commit**

```bash
git add src/features/coffee-tracker/components/AddStockDialog.tsx
git commit -m "refactor(dialog): update onAdd signature to include cost and shop"
```

---

## Task 9: Update useStock Hook

**Files:**
- Modify: `src/features/coffee-tracker/hooks/useStock.ts`

- [ ] **Step 1: Update addStock function to accept and pass cost and shop**

Find the `addStock` function and update the `apiClient.addStock` call:

```typescript
const addStock = useCallback(async (quantity: number, cost: number, shop: string) => {
  if (isAdding) return

  console.log('[useStock] Adding stock:', quantity, 'cost:', cost, 'shop:', shop)
  setIsAdding(true)
  setError(null)

  try {
    const newStock = await apiClient.addStock(
      DEFAULT_COFFEE_TYPE.brand,
      DEFAULT_COFFEE_TYPE.beanName,
      quantity,
      cost,
      shop
    )
    console.log('[useStock] Stock added:', newStock.quantity)
    setStock(newStock)
  } catch (err) {
    console.error('Failed to add stock:', err)
    setError(err instanceof Error ? err.message : 'Failed to add stock')
    throw err
  } finally {
    setIsAdding(false)
  }
}, [isAdding])
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bun run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/features/coffee-tracker/hooks/useStock.ts
git commit -m "feat(hook): update addStock to pass cost and shop to API"
```

---

## Task 10: Update StockCard Component Props

**Files:**
- Modify: `src/features/coffee-tracker/components/StockCard.tsx`

- [ ] **Step 1: Check if StockCard passes quantity to addStock**

Read the file and find where it calls `onAdd` (likely from AddStockDialog or similar)

Look for: `<AddStockDialog onAdd={...} />`

If it passes `onAdd={handleAddStock}` where `handleAddStock` calls `addStock`, update the handler to pass cost and shop:

```typescript
const handleAddStock = async (quantity: number, cost: number, shop: string) => {
  await addStock(quantity, cost, shop)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bun run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/features/coffee-tracker/components/StockCard.tsx
git commit -m "fix(stockcard): update addStock handler to pass cost and shop"
```

---

## Task 11: Manual Testing

**Files:**
- None (manual verification)

- [ ] **Step 1: Start dev servers**

Run: `bun run dev` (frontend)
Run: `bun run start` (backend, in separate terminal)

- [ ] **Step 2: Test adding stock without cost**

Expected: Error message "Cost is required"

- [ ] **Step 3: Test adding stock with cost but no shop**

Expected: Error message "Shop name is required"

- [ ] **Step 4: Test adding stock with negative cost**

Expected: Error message "Cost must be a non-negative number"

- [ ] **Step 5: Test successful stock addition**

Enter: Quantity: 50, Cost: 25.00, Shop: "Amazon"
Expected: Stock updates successfully, history entry created

- [ ] **Step 6: Verify history file**

Run: `cat data/stock-history.json`
Expected: Contains entry with your addition

- [ ] **Step 7: Test GET /api/stock-history endpoint**

Run in browser console or curl:
```javascript
fetch('/api/stock-history', { credentials: 'include' }).then(r => r.json()).then(console.log)
```
Expected: Array with your addition entry

- [ ] **Step 8: Test stock consumption still works**

Click the coffee count button
Expected: Stock decreases by 1, no errors

- [ ] **Step 9: Test multiple additions**

Add stock multiple times with different cost/shop values
Expected: All entries appear in history

---

## Task 12: Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md with new feature documentation**

Add to the "Stock Addition History" section (or create new section):

```markdown
## Stock Addition History

The app now tracks stock addition history with cost and shop information.

### Data Storage

- File: `data/stock-history.json`
- Each entry includes: id, userId, brand, beanName, quantity, cost, shop, timestamp

### API Endpoints

- `GET /api/stock-history` - Get user's addition history (optional `?limit=N` param)
- `POST /api/stock` - Now requires `cost` and `shop` fields

### Type Definitions

- `StockAddHistory` - Type for addition history entries
- Located in `src/features/coffee-tracker/types/CoffeeEntry.types.ts`

### Usage

When adding stock via the UI, users must now provide:
- Quantity (number of capsules)
- Total Cost (e.g., 25.00)
- Shop Name (e.g., "Amazon", "Local Store")
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with stock addition history documentation"
```

---

## Task 13: Version Bump and Final Commit

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump version**

Update version in `package.json` (e.g., 1.10.0 → 1.11.0):

```json
{
  "version": "1.11.0",
  ...
}
```

- [ ] **Step 2: Build and verify**

Run: `bun run build`
Expected: Build succeeds with new version

- [ ] **Step 3: Commit version bump**

```bash
git add package.json
git commit -m "chore: bump version to 1.11.0"
```

- [ ] **Step 4: Verify all tests pass**

Run: `bun run build`
Expected: No errors

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ Data storage file (`stock-history.json`) - Task 2
- ✅ TypeScript type with Zod schema - Task 1
- ✅ GET `/api/stock-history` endpoint - Task 3
- ✅ Modified POST `/api/stock` to require cost/shop - Task 4
- ✅ API client methods - Tasks 5, 6
- ✅ Frontend components updated - Tasks 7, 8, 9, 10
- ✅ Validation rules implemented - Task 4, 7
- ✅ Error handling - Task 4, 7

**Placeholder Scan:**
- ✅ All code shown in tasks
- ✅ No "TBD" or "TODO"
- ✅ Exact file paths provided
- ✅ Complete validation logic shown

**Type Consistency:**
- ✅ `StockAddHistory` type used consistently
- ✅ Method signatures match across tasks
- ✅ Field names match (cost, shop, quantity, etc.)
