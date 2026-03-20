import { Box, List, ListItem, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { formatTime } from '@/shared/utils/date';
import type { CoffeeEntry } from '../types/CoffeeEntry.types';

type TodayEntriesListProps = {
  entries: CoffeeEntry[];
  onDelete?: (id: string) => void;
};

export function TodayEntriesList({ entries, onDelete }: TodayEntriesListProps) {
  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
        padding: '12px 8px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          marginBottom: 2,
        }}
      >
        Today's Log
      </Typography>

      {entries.length === 0 ? (
        <Typography
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            padding: 5,
          }}
        >
          No coffees yet today
        </Typography>
      ) : (
        <List>
          {entries.map((entry) => (
            <ListItem
              key={entry.id}
              sx={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 0',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                }}
              >
                {formatTime(entry.createdAt)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  flex: 1,
                }}
              >
                {entry.brand}: {entry.beanName}
              </Typography>
              {onDelete && (
                <IconButton
                  size="small"
                  onClick={() => onDelete(entry.id)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
