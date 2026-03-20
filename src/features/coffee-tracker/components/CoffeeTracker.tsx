import { Box, Alert, CircularProgress } from '@mui/material'
import { CoffeeCountButton } from './CoffeeCountButton'
import { TodayEntriesList } from './TodayEntriesList'
import { useCoffeeEntries } from '../hooks/useCoffeeEntries'
import { apiClient } from '@/lib/api/client'

export function CoffeeTracker() {
  const { todayEntries, count, addEntry, isLoading, isAdding, error } = useCoffeeEntries()

  async function handleDelete(id: string): Promise<void> {
    try {
      await apiClient.deleteEntry(id)
      // Real-time sync will handle the UI update
    } catch (err) {
      console.error('Failed to delete entry:', err)
    }
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

      <CoffeeCountButton count={count} onAddEntry={addEntry} disabled={isAdding} />

      <Box sx={{ width: '100%', marginX: 0 }}>
        <TodayEntriesList entries={todayEntries} onDelete={handleDelete} />
      </Box>
    </Box>
  )
}
