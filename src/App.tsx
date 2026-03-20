import { Container, ThemeProvider, CssBaseline, Typography, Box } from '@mui/material';
import { theme } from './shared/styles/theme';
import { CoffeeTracker } from './features/coffee-tracker/components/CoffeeTracker';
import { APP_VERSION, BUILD_DATE } from './config/version';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <Box sx={{ flex: 1, padding: 2 }}>
          <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', marginBottom: 5 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: 1 }}>
                Coffee Tracker
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {getCurrentDate()}
              </Typography>
            </Box>
            <CoffeeTracker />
          </Container>
        </Box>

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
      </Box>
    </ThemeProvider>
  );
}

function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatBuildDate(isoDate: string): string {
  const date = new Date(isoDate);

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
}
