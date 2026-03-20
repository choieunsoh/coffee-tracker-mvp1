import { Container, ThemeProvider, CssBaseline, Typography, Box } from '@mui/material';
import { theme } from './shared/styles/theme';
import { CoffeeTracker } from './features/coffee-tracker/components/CoffeeTracker';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: 2,
        }}
      >
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
