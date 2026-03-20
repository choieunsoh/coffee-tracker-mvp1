import FacebookIcon from '@mui/icons-material/Facebook'
import { Box, Button, Card, Container, Typography } from '@mui/material'

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/auth/facebook'
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3,
        }}
      >
        <Card
          sx={{
            p: 6,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Coffee Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Track your daily coffee consumption
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<FacebookIcon />}
            onClick={handleLogin}
            sx={{
              backgroundColor: '#1877F2',
              '&:hover': { backgroundColor: '#166FE5' },
              py: 1.5,
              px: 4,
              mt: 2,
              fontSize: '1.1rem',
            }}
          >
            Continue with Facebook
          </Button>
        </Card>
      </Box>
    </Container>
  )
}
