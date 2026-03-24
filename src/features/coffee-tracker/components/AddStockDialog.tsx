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
