import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
} from '@mui/material'

type TimeOption = {
  label: string
  minutesAgo: number
}

const TIME_OPTIONS: TimeOption[] = [
  { label: '5 min ago', minutesAgo: 5 },
  { label: '10 min ago', minutesAgo: 10 },
  { label: '15 min ago', minutesAgo: 15 },
  { label: '30 min ago', minutesAgo: 30 },
  { label: '45 min ago', minutesAgo: 45 },
  { label: '1 hour ago', minutesAgo: 60 },
]

type TimeEditDialogProps = {
  open: boolean
  onClose: () => void
  onSelectTime: (newTimestamp: number) => void
  currentTimestamp?: number
}

export function TimeEditDialog({
  open,
  onClose,
  onSelectTime,
  currentTimestamp,
}: TimeEditDialogProps) {
  const handleSelectTime = (minutesAgo: number) => {
    // Calculate new timestamp: current time minus the selected minutes
    const newTimestamp = Date.now() - minutesAgo * 60 * 1000
    onSelectTime(newTimestamp)
    onClose()
  }

  const formatCurrentTime = (timestamp: number | undefined) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Entry Time</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current time: {formatCurrentTime(currentTimestamp)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Select new time:
        </Typography>
        <List>
          {TIME_OPTIONS.map((option) => (
            <ListItem
              key={option.label}
              disablePadding
              sx={{
                borderRadius: 1,
              }}
            >
              <ListItemButton
                onClick={() => handleSelectTime(option.minutesAgo)}
                sx={{
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                <ListItemText primary={option.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}
