import { Box, Alert, CircularProgress } from '@mui/material'
import { CoffeeCountButton } from './CoffeeCountButton'
import { TodayEntriesList } from './TodayEntriesList'
import { useCoffeeEntries } from '../hooks/useCoffeeEntries'

export function CoffeeTracker() {
  const { todayEntries, count, addEntry, updateEntryTimestamp, deleteEntry, isLoading, isAdding, error } = useCoffeeEntries()

  const handleDelete = async (id: string): Promise<void> => {
    await deleteEntry(id)
  }

  const handleEditTime = async (id: string, newTimestamp: number): Promise<void> => {
    await updateEntryTimestamp(id, newTimestamp)
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
        <TodayEntriesList entries={todayEntries} onDelete={handleDelete} onEditTime={handleEditTime} />
      </Box>
    </Box>
  )
}
