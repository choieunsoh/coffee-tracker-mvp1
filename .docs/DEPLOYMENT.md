# Coffee Tracker MVP - Local Deployment Guide

## Quick Start (Docker)

### Windows
```bash
# 1. Install Docker Desktop
# 2. Run the setup script
start-docker.bat

# 3. Access at http://localhost
```

### Mac/Linux
```bash
# 1. Install Docker
# 2. Make script executable
chmod +x start-docker.sh

# 3. Run the script
./start-docker.sh

# 4. Access at http://localhost
```

## Auto-Start on Machine Boot

### Windows (Task Scheduler)
1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task → "Coffee Tracker"
3. Trigger: "At startup"
4. Action: "Start a program"
5. Program: `docker-compose up -d`
6. Working directory: `H:\code\coffee-tracker-app\mvp1`

### Linux (systemd service)
```bash
# Create service file
sudo nano /etc/systemd/system/coffee-tracker.service
```

Add this content:
```ini
[Unit]
Description=Coffee Tracker MVP
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/mvp1
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable coffee-tracker.service
sudo systemctl start coffee-tracker.service
```

### Mac (launchd)
```bash
# Create plist file
sudo nano /Library/LaunchDaemons/com.coffeetracker.plist
```

Add this content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.coffeetracker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/docker-compose</string>
        <string>up</string>
        <string>-d</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/mvp1</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
</plist>
```

Load service:
```bash
sudo launchctl load /Library/LaunchDaemons/com.coffeetracker.plist
```

## Alternative: Simple Local Server

If you don't want Docker, just run:

```bash
# Development
bun run dev

# Production build
bun run build
bun run preview
```

## Docker Management Commands

```bash
# View logs
docker-compose logs -f

# Stop container
docker-compose down

# Restart container
docker-compose restart

# Update to latest version
docker-compose up -d --build
```

## Access Your Coffee Tracker

Once running, access at:
- **http://localhost** (Docker)
- **http://localhost:3001** (Development)

Your coffee data persists in browser localStorage, so it survives container restarts!
