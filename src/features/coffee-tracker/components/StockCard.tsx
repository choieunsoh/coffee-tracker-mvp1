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
