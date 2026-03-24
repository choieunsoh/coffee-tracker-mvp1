import { useState } from 'react'
import { Box, Alert, CircularProgress } from '@mui/material'
import { CoffeeCountButton } from './CoffeeCountButton'
import { TodayEntriesList } from './TodayEntriesList'
import { StockCard } from './StockCard'
import { AddStockDialog } from './AddStockDialog'
import { AddStockFAB } from './AddStockFAB'
import { useCoffeeEntries } from '../hooks/useCoffeeEntries'
import { useStock } from '../hooks/useStock'

export function CoffeeTracker() {
  // Get consumeStock from useStock to pass to useCoffeeEntries
  const { stock, isLoading: stockLoading, addStock, consumeStock } = useStock()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Pass consumeStock to useCoffeeEntries so it can check stock before adding entries
  const { todayEntries, count, addEntry, updateEntryTimestamp, deleteEntry, isLoading, isAdding, error } = useCoffeeEntries(consumeStock)

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

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <CircularProgress sx={{ color: '#D2691E' }} />
      </Box>
    )
  }

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
}
