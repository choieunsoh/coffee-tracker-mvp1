# Coffee Tracker - Local Network Sharing

## Option 1: Single Server (Recommended) ⭐

**Run ONE instance that all devices access**

### Setup (Windows Host)

**1. Find your local IP address:**
```bash
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

**2. Make Docker accessible from network:**

Update `docker-compose.yml`:
```yaml
version: '3.8'

services:
  coffee-tracker:
    build: .
    container_name: coffee-tracker-mvp
    ports:
      - "5001:80"
    restart: always
    environment:
      - NODE_ENV=production
    # Allow network access
    network_mode: "bridge"
```

**3. Restart container:**
```bash
docker-compose down
docker-compose up -d --build
```

**4. Access from any device on your WiFi:**

- **Phone/Tablet:** `http://192.168.1.100:5001`
- **Laptop:** `http://192.168.1.100:5001`
- **Desktop:** `http://192.168.1.100:5001`

**All devices share the same data!** 🎉

---

## Option 2: Export/Import Data

**For manual backup/restore:**

### Add Export/Import Buttons

Create `src/features/coffee-tracker/components/DataManager.tsx`:

```typescript
import { Button } from '@mui/material';

export function DataManager() {
  const exportData = () => {
    const data = localStorage.getItem('coffee-tracker-entries');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coffee-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        localStorage.setItem('coffee-tracker-entries', data);
        window.location.reload();
      };
      reader.readAsText(file);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
      <Button variant="outlined" onClick={exportData}>
        Export Data
      </Button>
      <Button variant="outlined" component="label">
        Import Data
        <input type="file" hidden accept=".json" onChange={importData} />
      </Button>
    </Box>
  );
}
```

---

## Option 3: Real-time Sync (Advanced)

**For automatic synchronization:**

### A. Add WebSocket Server

1. Install dependencies:
```bash
bun add ws @types/ws
```

2. Create simple WebSocket server
3. Broadcast changes to all connected devices

### B. Use SQLite with Network Storage

1. **Move to network-attached storage (NAS)**
2. **Use shared folder** for SQLite database
3. **All devices access same file**

---

## Quick Start Guide

### For Home Network:

1. **Choose one device as "server"** (e.g., your main PC)
2. **Run Docker container on server device**
3. **Find server's local IP:**
   ```bash
   # Windows
   ipconfig

   # Mac
   ifconfig | grep "inet "

   # Linux
   ip addr show
   ```

4. **Access from ANY device:**
   - Open browser
   - Go to `http://[SERVER_IP]:5001`
   - All devices see same data!

### Example URLs:
- `http://192.168.1.100:5001` (Your server IP)
- `http://192.168.1.100:5001` (From phone on same WiFi)

---

## Firewall Setup (If needed)

**Windows:**
1. Windows Defender Firewall
2. Allow port 5001
3. Or temporarily disable for local network

**Router:**
- Usually works automatically on same WiFi
- No port forwarding needed for local network

---

## Testing Connection

**From another device:**
```bash
# Test if server is reachable
curl http://192.168.1.100:5001

# Or just open browser
http://192.168.1.100:5001
```

---

## Data Persistence

**Current Setup:**
- ✅ Data stored in browser localStorage
- ✅ All devices on same URL share data
- ✅ Survives container restarts
- ✅ Works offline (cached)

**Note:** Clearing browser cache will reset data for that device only.
