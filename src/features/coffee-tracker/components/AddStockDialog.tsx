import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material'

type AddStockDialogProps = {
  open: boolean
  onClose: () => void
  onAdd: (quantity: number, cost: number, shop: string) => Promise<void>
}

export function AddStockDialog({ open, onClose, onAdd }: AddStockDialogProps) {
  const [quantity, setQuantity] = useState('')
  const [cost, setCost] = useState('')
  const [shop, setShop] = useState('')
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async () => {
    const num = parseInt(quantity, 10)
    const costNum = parseFloat(cost)

    // Validation
    if (!quantity || isNaN(num)) {
      setError('Please enter a quantity')
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

    // NEW: Validate cost
    if (cost === '' || isNaN(costNum)) {
      setError('Please enter a cost')
      return
    }

    if (costNum < 0) {
      setError('Cost cannot be negative')
      return
    }

    // NEW: Validate shop
    if (!shop.trim()) {
      setError('Please enter a shop name')
      return
    }

    setError('')
    setIsAdding(true)

    try {
      await onAdd(num, costNum, shop.trim())
      setQuantity('')
      setCost('')
      setShop('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setQuantity('')
    setCost('')
    setShop('')
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
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Total Cost"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAdding}
            inputProps={{ min: 0, step: 0.01 }}
            placeholder="e.g., 25.00"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Shop Name"
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAdding}
            placeholder="e.g., Amazon, Local Store"
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
