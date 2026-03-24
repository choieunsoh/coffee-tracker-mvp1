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
