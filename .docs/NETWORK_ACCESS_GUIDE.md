# Network Access Setup Guide

This guide helps you access the Coffee Tracker from other devices on your local network.

## Your Network Information

- **Your Local IP:** `192.168.1.107`
- **Port:** `5001`
- **Access URL:** `http://192.168.1.107:5001`

## Quick Test

### 1. Test from your computer

Open your browser and try:

```
http://192.168.1.107:5001
```

If this works, the server is accessible on your network.

### 2. Test from another device

On another PC/mobile on the same WiFi network, open:

```
http://192.168.1.107:5001
```

## Troubleshooting

### Issue 1: Cannot access from other devices

#### A. Check Windows Firewall

**Step 1:** Open Windows Firewall with Advanced Security

```
Press Win + R → Type "wf.msc" → Press Enter
```

**Step 2:** Check if port 5001 is blocked

- Look for "Inbound Rules"
- Search for rules blocking port 5001

**Step 3:** Add firewall rule (if needed)

Open Command Prompt as Administrator and run:

```cmd
netsh advfirewall firewall add rule name="Coffee Tracker" dir=in action=allow protocol=TCP localport=5001
```

**Step 4:** Verify the rule was added

```cmd
netsh advfirewall firewall show rule name="Coffee Tracker"
```

#### B. Check Docker is exposing the port

```bash
# Check if port is listening
netstat -ano | findstr :5001

# Should show something like:
# TCP    0.0.0.0:5001    0.0.0.0:0    LISTENING    12345
```

If you don't see it, restart Docker:

```bash
docker-compose down
docker-compose up -d
```

#### C. Check ALLOWED_ORIGINS

Your `docker-compose.yml` should have:

```yaml
environment:
  - ALLOWED_ORIGINS=http://localhost:5001,http://192.168.1.107:5001
```

Restart after changing:

```bash
docker-compose down
docker-compose up -d
```

### Issue 2: CORS errors in browser console

If you see CORS errors in the browser console:

**Solution:** Add the other PC's IP to ALLOWED_ORIGINS

```bash
# Stop the container
docker-compose down

# Edit .env file and add IPs:
# ALLOWED_ORIGINS=http://localhost:5001,http://192.168.1.107:5001,http://192.168.1.XXX:5001

# Restart
docker-compose up -d
```

### Issue 3: Facebook OAuth not working on other devices

Facebook OAuth requires the redirect URI to match exactly. You need to:

**Step 1:** Go to Facebook App Dashboard

```
https://developers.facebook.com/apps/
```

**Step 2:** Add your local IP to Valid OAuth Redirect URIs:

```
http://192.168.1.107:5001/api/auth/facebook/callback
```

**Step 3:** Add to App Domains:

```
192.168.1.107
```

**Step 4:** Save changes

### Issue 4: IP address changes

If your IP changes (dynamic IP), use a wildcard or update it:

**Option A:** Allow all origins (NOT recommended for production)

```bash
# Edit server.js - CORS section
origin: "*",  # Allows all origins
```

**Option B:** Set up static IP (recommended)

1. Open Router Settings (usually 192.168.1.1)
2. Find DHCP Reservation
3. Reserve IP 192.168.1.107 for your computer

**Option C:** Use localhost/hostname

```bash
# Get your computer name
hostname

# Use hostname instead of IP
http://YOUR-COMPUTER-NAME:5001
```

## Testing Connectivity

### From your computer

```bash
# Test if server is listening
netstat -ano | findstr :5001

# Test if port is accessible
curl http://192.168.1.107:5001
```

### From another device

```bash
# On Linux/Mac
curl http://192.168.1.107:5001

# On Windows (PowerShell)
Test-NetConnection -ComputerName 192.168.1.107 -Port 5001
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Local Network Only** - This setup is safe for home WiFi
2. **Public WiFi** - NEVER use this on public WiFi networks
3. **Firewall** - Keep Windows Firewall enabled
4. **HTTPS** - For production, use HTTPS (see deployment guide)
5. **VPN** - For remote access, use a VPN instead of exposing to internet

## Current Configuration

**docker-compose.yml:**

```yaml
ports:
  - '5001:5001' # Exposes port 5001 to all network interfaces
environment:
  - ALLOWED_ORIGINS=http://localhost:5001,http://192.168.1.107:5001
```

**server.js:**

```javascript
app.use(
  cors({
    origin: allowedOrigins, // Checks against ALLOWED_ORIGINS
    credentials: true,
  })
)
```

## How to Find Your IP

If your IP changes, find it again:

**Windows:**

```cmd
ipconfig
```

Look for "IPv4 Address" under your active network adapter

**Mac/Linux:**

```bash
ifconfig | grep "inet "
```

Or visit: <https://www.whatismyip.com/> (shows your public IP, not local)

## Access from Mobile

1. **Connect mobile to same WiFi**
2. **Open browser and go to:** `http://192.168.1.107:5001`
3. **Login with Facebook** (make sure redirect URI is configured)

## Common Router Settings

Some routers block device-to-device communication (AP Isolation). Check:

1. **Login to router** (usually 192.168.1.1 or 192.168.0.1)
2. **Find "AP Isolation" or "Guest Network" settings**
3. **Disable AP Isolation** if enabled

## Still Not Working?

### Checklist

- [ ] Server is running: `docker-compose ps`
- [ ] Port is listening: `netstat -ano | findstr :5001`
- [ ] Firewall allows port 5001
- [ ] ALLOWED_ORIGINS includes your IP
- [ ] Both devices on same WiFi network
- [ ] No VPN is active on either device
- [ ] Try different browser
- [ ] Clear browser cache

### Debug Commands

```bash
# Check Docker logs
docker-compose logs -f

# Check container status
docker-compose ps

# Restart everything
docker-compose down
docker-compose up -d

# Check what's listening on port 5001
netstat -ano | findstr :5001
```

## Need Help?

Check these resources:

- [Docker Networking](https://docs.docker.com/compose/networking/)
- [Windows Firewall](https://support.microsoft.com/en-us/help/4028544)
- [Facebook OAuth](https://developers.facebook.com/docs/facebook-login/)

---

**Last Updated:** 2026-03-20
**Your IP:** 192.168.1.107 (may change)
**Version:** 1.5.0
