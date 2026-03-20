import { Avatar, Box, Button, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        mb: 2,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 1,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1877F2', width: 40, height: 40 }}>{user?.name?.charAt(0).toUpperCase()}</Avatar>
        <Box>
          <Typography variant="body1" fontWeight="medium">
            {user?.name}
          </Typography>
          {user?.email && (
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          )}
        </Box>
      </Box>
      <Button size="small" onClick={logout} variant="outlined">
        Logout
      </Button>
    </Box>
  );
}
