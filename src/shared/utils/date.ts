export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function getTodayStart(): number {
  // Get current date in user's local timezone
  const now = new Date();
  // Create a date representing midnight today in local timezone
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  // Return as Unix timestamp (milliseconds since epoch)
  return startOfDay.getTime();
}
