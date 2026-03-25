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
  TextField,
} from '@mui/material'
import { formatTime } from '@/shared/utils/date'
import { useState } from 'react'

type TimeOption = {
  label: string
  minutesAgo?: number
  isCustom?: boolean
}

const TIME_OPTIONS: TimeOption[] = [
  { label: '5 min ago', minutesAgo: 5 },
  { label: '10 min ago', minutesAgo: 10 },
  { label: '15 min ago', minutesAgo: 15 },
  { label: '30 min ago', minutesAgo: 30 },
  { label: '45 min ago', minutesAgo: 45 },
  { label: '1 hour ago', minutesAgo: 60 },
  { label: 'Custom...', isCustom: true },
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
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customTime, setCustomTime] = useState('')
  const [customTimeError, setCustomTimeError] = useState('')

  const handleSelectTime = (option: TimeOption) => {
    if (option.isCustom) {
      setShowCustomInput(true)
      setCustomTime('')
      setCustomTimeError('')
    } else if (option.minutesAgo !== undefined) {
      // Calculate new timestamp: current time minus the selected minutes
      const newTimestamp = Date.now() - option.minutesAgo * 60 * 1000
      onSelectTime(newTimestamp)
      onClose()
    }
  }

  const parseCustomTime = (timeString: string): number | null => {
    // Validate HH:mm:ss format
    const regex = /^(\d{1,2}):(\d{2}):(\d{2})$/
    const match = timeString.match(regex)

    if (!match) {
      setCustomTimeError('Invalid format. Use HH:mm:ss')
      return null
    }

    const [, hoursStr, minutesStr, secondsStr] = match
    const hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    const seconds = parseInt(secondsStr, 10)

    // Validate ranges
    if (hours > 23) {
      setCustomTimeError('Hours must be 00-23')
      return null
    }
    if (minutes > 59) {
      setCustomTimeError('Minutes must be 00-59')
      return null
    }
    if (seconds > 59) {
      setCustomTimeError('Seconds must be 00-59')
      return null
    }

    setCustomTimeError('')

    // Create timestamp for today at the specified time
    const now = new Date()
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      seconds
    )

    // If the time is in the future, assume it was from yesterday
    if (targetDate.getTime() > now.getTime()) {
      targetDate.setDate(targetDate.getDate() - 1)
    }

    return targetDate.getTime()
  }

  const handleCustomTimeSubmit = () => {
    const timestamp = parseCustomTime(customTime)
    if (timestamp !== null) {
      onSelectTime(timestamp)
      setShowCustomInput(false)
      setCustomTime('')
      onClose()
    }
  }

  const handleBackToOptions = () => {
    setShowCustomInput(false)
    setCustomTime('')
    setCustomTimeError('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Entry Time</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current time: {currentTimestamp ? formatTime(currentTimestamp) : ''}
          </Typography>
        </Box>

        {!showCustomInput ? (
          <>
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
                    onClick={() => handleSelectTime(option)}
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
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter custom time (HH:mm:ss):
            </Typography>
            <TextField
              fullWidth
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder="HH:mm:ss"
              error={!!customTimeError}
              helperText={customTimeError || 'Example: 14:30:00'}
              autoFocus
              sx={{ mb: 2 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customTime) {
                  handleCustomTimeSubmit()
                }
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!showCustomInput ? (
          <Button onClick={onClose}>Cancel</Button>
        ) : (
          <>
            <Button onClick={handleBackToOptions}>Back</Button>
            <Button onClick={handleCustomTimeSubmit} variant="contained" disabled={!customTime}>
              Set Time
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
