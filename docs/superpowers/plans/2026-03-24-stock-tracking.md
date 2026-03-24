# Stock Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add coffee capsule stock tracking with FAB button, auto-decrement on coffee logging, and block adding when stock reaches zero.

**Architecture:** Separate `stock-data.json` file with dedicated backend endpoints. Stock tracked per coffee type (extensible). Phase 1 uses `DEFAULT_COFFEE_TYPE`. Frontend uses custom hook pattern (`useStock`) following existing `useCoffeeEntries` pattern.

**Tech Stack:** React 19, TypeScript, Material-UI, Express, Zod, file-based JSON storage

---

## File Structure

### New Files
- `data/stock-data.json` - Stock data storage
- `src/features/coffee-tracker/components/StockCard.tsx` - Stock display component
- `src/features/coffee-tracker/components/AddStockDialog.tsx` - Add stock dialog
- `src/features/coffee-tracker/components/AddStockFAB.tsx` - Floating action button
- `src/features/coffee-tracker/hooks/useStock.ts` - Stock state management hook

### Modified Files
- `server.js` - Add stock API endpoints
- `src/features/coffee-tracker/types/CoffeeEntry.types.ts` - Add CoffeeStock type
- `src/lib/api/client.ts` - Add stock API methods
- `src/features/coffee-tracker/hooks/useCoffeeEntries.ts` - Integrate stock consume
- `src/features/coffee-tracker/components/CoffeeCountButton.tsx` - Disable when no stock
- `src/features/coffee-tracker/components/CoffeeTracker.tsx` - Add stock components

---

## Task 1: Add TypeScript Types for CoffeeStock

**Files:**
- Modify: `src/features/coffee-tracker/types/CoffeeEntry.types.ts`

- [ ] **Step 1: Add CoffeeStock Zod schema and type**

Add to end of `src/features/coffee-tracker/types/CoffeeEntry.types.ts`:

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

- [ ] **Step 2: Commit**

```bash
git add src/features/coffee-tracker/types/CoffeeEntry.types.ts
git commit -m "feat: add CoffeeStock type definition"
```

---

## Task 2: Add Backend Stock Endpoints

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add stock data file constants**

Add after `DB_FILE` constant (around line 20):

```javascript
const STOCK_DB_FILE = path.join(DATA_DIR, 'stock-data.json');
```

- [ ] **Step 2: Add stock database functions**

Add after `writeDatabase()` function (around line 387):

```javascript
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
```

- [ ] **Step 3: Add GET /api/stock endpoint**

Add after `/api/entries/:id` PATCH endpoint (around line 370):

```javascript
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
```

- [ ] **Step 4: Add POST /api/stock endpoint**

Add after GET /api/stock endpoint:

```javascript
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
    if (typeof brand !== 'string' || brand.trim().length === 0 || brand.length > 100) {
      return res.status(400).json({ error: 'Invalid brand' });
    }

    // Validate beanName
    if (typeof beanName !== 'string' || beanName.trim().length === 0 || beanName.length > 100) {
      return res.status(400).json({ error: 'Invalid beanName' });
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
```

- [ ] **Step 5: Add POST /api/stock/consume endpoint**

Add after POST /api/stock endpoint:

```javascript
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
    if (typeof brand !== 'string' || brand.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid brand' });
    }

    // Validate beanName
    if (typeof beanName !== 'string' || beanName.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid beanName' });
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
```

- [ ] **Step 6: Commit**

```bash
git add server.js
git commit -m "feat: add stock tracking API endpoints

Add GET /api/stock, POST /api/stock, POST /api/stock/consume
with validation and user isolation."
```

---

## Task 3: Add Stock API Methods to Client

**Files:**
- Modify: `src/lib/api/client.ts`

- [ ] **Step 1: Read existing client structure**

Check the `CoffeeApiClient` class to understand existing patterns.

- [ ] **Step 2: Add stock methods to CoffeeApiClient class**

Add these methods to the `CoffeeApiClient` class (after `deleteEntry` method):

```typescript
async getStock(): Promise<CoffeeStock[]> {
  const response = await this.fetch('/api/stock', { method: 'GET' })

  if (!response.ok) {
    throw new Error(`Failed to fetch stock: ${response.statusText}`)
  }

  return response.json() as Promise<CoffeeStock[]>
}

async addStock(brand: string, beanName: string, quantity: number): Promise<CoffeeStock> {
  const response = await this.fetch('/api/stock', {
    method: 'POST',
    body: JSON.stringify({ brand, beanName, quantity }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add stock')
  }

  return response.json() as Promise<CoffeeStock>
}

async consumeStock(brand: string, beanName: string): Promise<{ success: boolean; remaining: number }> {
  const response = await this.fetch('/api/stock/consume', {
    method: 'POST',
    body: JSON.stringify({ brand, beanName }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to consume stock')
  }

  return response.json() as Promise<{ success: boolean; remaining: number }>
}
```

- [ ] **Step 3: Add CoffeeStock import at top of file**

Add to imports:
```typescript
import type { CoffeeStock } from '@/features/coffee-tracker/types/CoffeeEntry.types'
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "feat: add stock API methods to client

Add getStock, addStock, consumeStock methods to CoffeeApiClient"
```

---

## Task 4: Create useStock Hook

**Files:**
- Create: `src/features/coffee-tracker/hooks/useStock.ts`

- [ ] **Step 1: Create useStock hook file**

Create `src/features/coffee-tracker/hooks/useStock.ts`:

```typescript
import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { DEFAULT_COFFEE_TYPE } from '@/config/app.config'
import type { CoffeeStock } from '../types/CoffeeEntry.types'

type UseStockReturn = {
  stock: CoffeeStock | null
  isLoading: boolean
  isAdding: boolean
  error: string | null
  addStock: (quantity: number) => Promise<void>
  consumeStock: () => Promise<boolean>
  refreshStock: () => Promise<void>
}

export function useStock(): UseStockReturn {
  const [stock, setStock] = useState<CoffeeStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStock = useCallback(async () => {
    try {
      console.log('[useStock] Loading stock...')
      const stocks = await apiClient.getStock()

      // Find stock for default coffee type
      const defaultStock = stocks.find(
        s => s.brand === DEFAULT_COFFEE_TYPE.brand && s.beanName === DEFAULT_COFFEE_TYPE.beanName
      )

      setStock(defaultStock || null)
      setError(null)
    } catch (err) {
      console.error('Failed to load stock:', err)
      setError('Failed to load stock from server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStock()
  }, [loadStock])

  const addStock = useCallback(async (quantity: number) => {
    if (isAdding) return

    console.log('[useStock] Adding stock:', quantity)
    setIsAdding(true)
    setError(null)

    try {
      const newStock = await apiClient.addStock(
        DEFAULT_COFFEE_TYPE.brand,
        DEFAULT_COFFEE_TYPE.beanName,
        quantity
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

  const consumeStock = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useStock] Consuming stock...')
      const result = await apiClient.consumeStock(
        DEFAULT_COFFEE_TYPE.brand,
        DEFAULT_COFFEE_TYPE.beanName
      )

      if (stock) {
        setStock({ ...stock, quantity: result.remaining, updatedAt: Date.now() })
      }

      console.log('[useStock] Stock consumed, remaining:', result.remaining)
      return true
    } catch (err) {
      console.error('Failed to consume stock:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to consume stock'
      setError(errorMessage)
      return false
    }
  }, [stock])

  return {
    stock,
    isLoading,
    isAdding,
    error,
    addStock,
    consumeStock,
    refreshStock: loadStock,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/coffee-tracker/hooks/useStock.ts
git commit -m "feat: add useStock hook

Add custom hook for stock state management with addStock,
consumeStock, and refreshStock methods."
```

---

## Task 5: Create StockCard Component

**Files:**
- Create: `src/features/coffee-tracker/components/StockCard.tsx`

- [ ] **Step 1: Create StockCard component**

Create `src/features/coffee-tracker/components/StockCard.tsx`:

```typescript
import { Box, Typography, CircularProgress } from '@mui/material'
import type { CoffeeStock } from '../types/CoffeeEntry.types'

type StockCardProps = {
  stock: CoffeeStock | null
  isLoading: boolean
}

export function StockCard({ stock, isLoading }: StockCardProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80px',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          padding: 3,
        }}
      >
        <CircularProgress sx={{ color: '#D2691E' }} />
      </Box>
    )
  }

  // Empty state
  if (!stock) {
    return (
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          padding: 3,
          textAlign: 'center',
          minWidth: '300px',
        }}
      >
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          No capsule stock
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Add capsules to get started
        </Typography>
      </Box>
    )
  }

  // Color coding based on quantity
  const getColor = () => {
    if (stock.quantity <= 2) return '#ef5350' // red
    if (stock.quantity <= 9) return '#ffa726' // yellow/orange
    return '#66bb6a' // green
  }

  const stockColor = getColor()
  const isLowStock = stock.quantity <= 2

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        padding: 3,
        textAlign: 'center',
        minWidth: '300px',
        border: `2px solid ${stockColor}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
        {stock.brand} {stock.beanName}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Typography variant="h3" sx={{ color: stockColor, fontWeight: 'bold' }}>
          {stock.quantity}
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          capsules
        </Typography>
      </Box>

      {isLowStock && (
        <Typography
          variant="body2"
          sx={{
            color: stockColor,
            mt: 1,
            fontWeight: 'medium',
          }}
        >
          Low stock!
        </Typography>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/coffee-tracker/components/StockCard.tsx
git commit -m "feat: add StockCard component

Display stock quantity with color coding (green/yellow/red)
and low stock warning. Shows empty state when no stock."
```

---

## Task 6: Create AddStockDialog Component

**Files:**
- Create: `src/features/coffee-tracker/components/AddStockDialog.tsx`

- [ ] **Step 1: Create AddStockDialog component**

Create `src/features/coffee-tracker/components/AddStockDialog.tsx`:

```typescript
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material'

type AddStockDialogProps = {
  open: boolean
  onClose: () => void
  onAdd: (quantity: number) => Promise<void>
}

export function AddStockDialog({ open, onClose, onAdd }: AddStockDialogProps) {
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async () => {
    const num = parseInt(quantity, 10)

    // Validation
    if (!quantity || isNaN(num)) {
      setError('Please enter a number')
      return
    }

    if (num < 1) {
      setError('Quantity must be at least 1')
      return
    }

    if (num > 1000) {
      setError('Quantity cannot exceed 1000')
      return
    }

    setError('')
    setIsAdding(true)

    try {
      await onAdd(num)
      setQuantity('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setQuantity('')
    setError('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      handleSubmit()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Capsules</DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!error}
            helperText={error || 'Enter number of capsules (1-1000)'}
            disabled={isAdding}
            inputProps={{ min: 1, max: 1000 }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isAdding}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isAdding || !quantity}
          sx={{ bgcolor: '#D2691E', '&:hover': { bgcolor: '#B9561B' } }}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/coffee-tracker/components/AddStockDialog.tsx
git commit -m "feat: add AddStockDialog component

Dialog for adding stock with number input validation.
Auto-focus on open, submit on Enter key."
```

---

## Task 7: Create AddStockFAB Component

**Files:**
- Create: `src/features/coffee-tracker/components/AddStockFAB.tsx`

- [ ] **Step 1: Create AddStockFAB component**

Create `src/features/coffee-tracker/components/AddStockFAB.tsx`:

```typescript
import { Fab } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

type AddStockFABProps = {
  onClick: () => void
}

export function AddStockFAB({ onClick }: AddStockFABProps) {
  return (
    <Fab
      color="primary"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        backgroundColor: '#D2691E',
        '&:hover': {
          backgroundColor: '#B9561B',
        },
      }}
      aria-label="Add stock"
    >
      <AddIcon />
    </Fab>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/coffee-tracker/components/AddStockFAB.tsx
git commit -m "feat: add AddStockFAB component

Floating action button positioned bottom-right
for adding stock."
```

---

## Task 8: Integrate Stock Consume into useCoffeeEntries

**Files:**
- Modify: `src/features/coffee-tracker/hooks/useCoffeeEntries.ts`

- [ ] **Step 1: Add consumeStock parameter to hook**

Modify the `useCoffeeEntries` hook signature to accept `consumeStock` function:

Update the hook to accept optional `consumeStock` parameter:

```typescript
export function useCoffeeEntries(consumeStock?: () => Promise<boolean>) {
```

- [ ] **Step 2: Modify addEntry to consume stock first**

Update the `addEntry` function to check stock before creating entry:

```typescript
const addEntry = useCallback(async () => {
  if (isAdding) {
    console.log('[addEntry] Already adding, returning')
    return
  }

  console.log('[addEntry] Starting addEntry...')
  setIsAdding(true)
  setError(null)

  try {
    // Consume stock first (if stock tracking is enabled)
    if (consumeStock) {
      console.log('[addEntry] Consuming stock...')
      const consumed = await consumeStock()
      if (!consumed) {
        setError('Not enough capsules. Please add more stock.')
        setIsAdding(false)
        return
      }
    }

    console.log('[addEntry] Calling API...')
    const newEntry = await apiClient.addEntry(
      DEFAULT_COFFEE_TYPE.brand,
      DEFAULT_COFFEE_TYPE.beanName
    )
    console.log('[addEntry] Created entry:', newEntry.id)

    // Optimistic update
    console.log('[addEntry] Optimistic update - adding to state')
    setTodayEntries((prevEntries) => {
      console.log('[addEntry] Current entries:', prevEntries.length)
      return [newEntry, ...prevEntries]
    })
  } catch (err) {
    console.error('Failed to add entry:', err)
    setError('Failed to add coffee entry')
    // Reload to get correct state
    loadEntries()
  } finally {
    setIsAdding(false)
  }
}, [isAdding, loadEntries, consumeStock])
```

- [ ] **Step 3: Commit**

```bash
git add src/features/coffee-tracker/hooks/useCoffeeEntries.ts
git commit -m "feat: integrate stock consume into addEntry

Call consumeStock before creating entry. Block entry creation
if stock consumption fails (insufficient stock)."
```

---

## Task 9: Modify CoffeeCountButton to Show Disabled State

**Files:**
- Modify: `src/features/coffee-tracker/components/CoffeeCountButton.tsx`

- [ ] **Step 1: Read current CoffeeCountButton component**

Read the file to understand current structure.

- [ ] **Step 2: Add disabledReason prop**

Add `disabledReason` prop to show tooltip when disabled:

```typescript
type CoffeeCountButtonProps = {
  count: number
  onAddEntry: () => void
  disabled: boolean
  disabledReason?: string  // NEW
}
```

- [ ] **Step 3: Add Tooltip for disabled state**

Wrap button with MUI Tooltip when there's a disabled reason:

```typescript
import { Tooltip } from '@mui/material'
// ... other imports

export function CoffeeCountButton({ count, onAddEntry, disabled, disabledReason }: CoffeeCountButtonProps) {
  const button = (
    <Button
      // ... existing props
      disabled={disabled}
    >
      {/* existing content */}
    </Button>
  )

  if (disabled && disabledReason) {
    return (
      <Tooltip title={disabledReason} arrow>
        <span>{button}</span>
      </Tooltip>
    )
  }

  return button
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/coffee-tracker/components/CoffeeCountButton.tsx
git commit -m "feat: add disabledReason prop to CoffeeCountButton

Show tooltip explaining why button is disabled (e.g., no stock)."
```

---

## Task 10: Integrate Stock Components into CoffeeTracker

**Files:**
- Modify: `src/features/coffee-tracker/components/CoffeeTracker.tsx`

- [ ] **Step 1: Import stock components and hook**

Add imports:
```typescript
import { StockCard } from './StockCard'
import { AddStockDialog } from './AddStockDialog'
import { AddStockFAB } from './AddStockFAB'
import { useStock } from '../hooks/useStock'
```

- [ ] **Step 2: Add stock state to CoffeeTracker component**

Add stock hook and dialog state:
```typescript
export function CoffeeTracker() {
  const { todayEntries, count, addEntry, updateEntryTimestamp, deleteEntry, isLoading, isAdding, error } = useCoffeeEntries(consumeStock)
  const { stock, isLoading: stockLoading, addStock } = useStock()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleDelete = async (id: string): Promise<void> => {
    await deleteEntry(id)
  }

  const handleEditTime = async (id: string, newTimestamp: number): Promise<void> => {
    await updateEntryTimestamp(id, newTimestamp)
  }

  const handleAddStock = async (quantity: number) => {
    await addStock(quantity)
  }

  const getDisabledReason = () => {
    if (!stock) return 'Add stock before logging coffee'
    if (stock.quantity < 1) return 'No capsules remaining. Add more stock to continue.'
    return undefined
  }
```

- [ ] **Step 3: Fix useCoffeeEntries call - need to get consumeStock from useStock**

Update to destructure consumeStock:
```typescript
const { stock, isLoading: stockLoading, addStock, consumeStock } = useStock()
```

- [ ] **Step 4: Add StockCard and FAB to JSX**

Add components to the return JSX:

```tsx
return (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      padding: 3,
    }}
  >
    {error && (
      <Alert severity="error" onClose={() => window.location.reload()}>
        {error}
      </Alert>
    )}

    <StockCard stock={stock} isLoading={stockLoading} />

    <CoffeeCountButton
      count={count}
      onAddEntry={addEntry}
      disabled={isAdding || !stock || stock.quantity < 1}
      disabledReason={getDisabledReason()}
    />

    <Box sx={{ width: '100%', marginX: 0 }}>
      <TodayEntriesList entries={todayEntries} onDelete={handleDelete} onEditTime={handleEditTime} />
    </Box>

    <AddStockFAB onClick={() => setDialogOpen(true)} />

    <AddStockDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onAdd={handleAddStock}
    />
  </Box>
)
```

- [ ] **Step 5: Add useState import if not present**

Make sure `useState` is imported from React.

- [ ] **Step 6: Commit**

```bash
git add src/features/coffee-tracker/components/CoffeeTracker.tsx
git commit -m "feat: integrate stock tracking components

Add StockCard, AddStockDialog, and AddStockFAB to CoffeeTracker.
Disable coffee button when stock is empty or not initialized."
```

---

## Task 11: Manual Testing

**Files:**
- None (testing only)

- [ ] **Step 1: Start backend server**

```bash
bun run start
```

Verify: Server starts on port 5001

- [ ] **Step 2: Start frontend dev server**

```bash
bun run dev
```

Verify: App loads at http://localhost:3001

- [ ] **Step 3: Test empty state**

Login to the app and verify:
- StockCard shows "No capsule stock. Add capsules to get started."
- CoffeeCountButton is disabled
- Hovering button shows "Add stock before logging coffee"

- [ ] **Step 4: Test adding stock**

- Click FAB button (bottom-right)
- Dialog opens with "Add Capsules" title
- Enter "12" and click Add
- StockCard shows "12 capsules" in green
- CoffeeCountButton becomes enabled

- [ ] **Step 5: Test consuming stock**

- Click CoffeeCountButton
- Stock decreases to 11
- Coffee entry is created
- Repeat until stock reaches 2
- Verify StockCard shows yellow color + "Low stock!"

- [ ] **Step 6: Test zero stock block**

- Continue clicking until stock reaches 0
- CoffeeCountButton becomes disabled
- Hovering shows "No capsules remaining. Add more stock to continue."
- Cannot add coffee entries

- [ ] **Step 7: Test adding more stock**

- Click FAB, enter "10"
- Stock updates to 10
- CoffeeCountButton enabled again

- [ ] **Step 8: Test validation**

- Open dialog, enter "-1" → Shows "Quantity must be at least 1"
- Enter "0" → Shows same error
- Enter "1001" → Shows "Quantity cannot exceed 1000"
- Enter "abc" → Shows "Please enter a number"

- [ ] **Step 9: Test stock accumulation**

- Add 12 capsules (total: 10)
- Verify stock updated (not duplicated)

---

## Task 12: Update Version and Deploy

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump version**

Update version in `package.json`:
```json
"version": "1.8.0"
```

- [ ] **Step 2: Commit version bump**

```bash
git add package.json
git commit -m "chore: bump version to 1.8.0"
```

- [ ] **Step 3: Tag release**

```bash
git tag v1.8.0
git push origin main --tags
```

---

## Summary

This implementation adds:

1. **Backend**: 3 new API endpoints (`/api/stock`, POST `/api/stock`, `/api/stock/consume`)
2. **Types**: `CoffeeStock` Zod schema
3. **API Client**: 3 new methods (`getStock`, `addStock`, `consumeStock`)
4. **Hook**: `useStock` for stock state management
5. **Components**: `StockCard`, `AddStockDialog`, `AddStockFAB`
6. **Integration**: Stock consume before entry creation, button disabled at zero

The feature follows existing patterns (custom hooks, feature-based organization) and is extensible for Phase 2 multi-type support.
