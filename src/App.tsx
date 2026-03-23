import {
  Box,
  CircularProgress,
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { APP_VERSION, BUILD_DATE } from './config/version'
import { CoffeeTracker } from './features/coffee-tracker/components/CoffeeTracker'
import { LoginPage } from './features/coffee-tracker/components/LoginPage'
import { UserProfile } from './features/coffee-tracker/components/UserProfile'
import { AuthProvider, useAuth } from './features/coffee-tracker/contexts/AuthContext'
import { theme } from './shared/styles/theme'

function AppContent() {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#1877F2' }} />
      </Box>
    )
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />
  }

  // Show main app if authenticated
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 2 }}>
        <UserProfile />
        <Box sx={{ textAlign: 'center', marginBottom: 5 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: 1 }}>
            Coffee Tracker
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {getCurrentDate()}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <CoffeeTracker />
        </Box>
      </Container>

      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
            padding: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
            v{APP_VERSION} • {formatBuildDate(BUILD_DATE)}
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

function getCurrentDate(): string {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatBuildDate(isoDate: string): string {
  const date = new Date(isoDate)

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`
}
