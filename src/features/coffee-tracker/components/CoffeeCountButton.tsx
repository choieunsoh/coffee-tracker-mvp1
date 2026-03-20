import { useState } from 'react';
import { Box, Typography } from '@mui/material';

type CoffeeCountButtonProps = {
  count: number;
  onAddEntry: () => void;
  disabled?: boolean;
};

export function CoffeeCountButton({ count, onAddEntry, disabled }: CoffeeCountButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    // Prevent default to avoid any bubbling issues
    e.preventDefault();
    e.stopPropagation();

    console.log('[CoffeeCountButton] Clicked, disabled:', disabled, 'isProcessing:', isProcessing);

    // Guard against multiple clicks
    if (disabled || isProcessing) {
      console.log('[CoffeeCountButton] Blocked - disabled or already processing');
      return;
    }

    if (!onAddEntry) {
      console.log('[CoffeeCountButton] No onAddEntry handler');
      return;
    }

    console.log('[CoffeeCountButton] Calling onAddEntry');
    setIsProcessing(true);

    try {
      await onAddEntry();
    } finally {
      // Small delay to prevent rapid double-clicks
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        width: { xs: 200, sm: 250 },
        height: { xs: 200, sm: 250 },
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4B2E2A 0%, #6F4E37 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 10px 30px rgba(75, 46, 42, 0.4)',
        opacity: disabled || isProcessing ? 0.6 : 1,
        '&:hover': disabled || isProcessing ? {} : {
          transform: 'scale(1.05)',
          boxShadow: '0 15px 40px rgba(139, 69, 19, 0.4)',
        },
        '&:active': disabled || isProcessing ? {} : {
          transform: 'scale(0.95)',
        },
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '4rem', sm: '5rem' },
          fontWeight: 700,
          color: 'white',
          lineHeight: 1,
        }}
      >
        {count}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.9rem',
          color: 'white',
          marginTop: 2,
          opacity: 0.9,
        }}
      >
        {disabled || isProcessing ? 'Adding...' : 'cups today'}
      </Typography>
    </Box>
  );
}
