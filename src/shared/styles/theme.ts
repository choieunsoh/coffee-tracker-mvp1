import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: {
      main: '#8B4513',
    },
    secondary: {
      main: '#D2691E',
    },
    background: {
      default: '#1a1a2e',
      paper: '#16213e',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
})
