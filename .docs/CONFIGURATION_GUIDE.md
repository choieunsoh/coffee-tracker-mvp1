# Configuration Guide

This guide explains all configuration options for the Coffee Tracker app.

## Environment Variables

All configuration is done through environment variables in the `.env` file.

### Facebook OAuth Credentials

```bash
# Required for authentication
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

**How to get these values:**

1. Go to <https://developers.facebook.com/apps/>
2. Create a new app (Consumer type)
3. Add Facebook Login product
4. Copy App ID and App Secret

See [Facebook Auth Setup](FACEBOOK_AUTH_SETUP.md) for detailed instructions.

### Session Configuration

```bash
# Required: Secret key for session encryption
SESSION_SECRET=your-random-session-secret-here

# Optional: Session expiration in days (default: 7)
SESSION_EXPIRE_DAYS=7
```

**SESSION_SECRET:**

- Generate with: `openssl rand -base64 32`
- Must be a random string
- Keep this secret!

**SESSION_EXPIRE_DAYS:**

- Controls how long users stay logged in
- Default: 7 days if not specified
- Examples:
  - `SESSION_EXPIRE_DAYS=1` - 1 day
  - `SESSION_EXPIRE_DAYS=7` - 7 days (default)
  - `SESSION_EXPIRE_DAYS=30` - 30 days

### CORS Configuration

```bash
# Required: Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:5001,http://192.168.1.107:5001
```

**For local development:**

```bash
# Localhost only
ALLOWED_ORIGINS=http://localhost:5001

# Localhost + your IP (for network access)
ALLOWED_ORIGINS=http://localhost:5001,http://192.168.1.107:5001
```

**For production:**

```bash
# Single domain
ALLOWED_ORIGINS=https://your-domain.com

# Multiple domains
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Environment

```bash
# Required: Environment mode
NODE_ENV=production
```

- **development**: Shows detailed errors, less optimized
- **production**: Optimized for performance, minimal error details

## Complete .env Example

```bash
# ============================================
# Facebook OAuth Credentials
# ============================================
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abc123def456ghi789jkl012mno345pq

# ============================================
# Session Configuration
# ============================================
SESSION_SECRET=Kx7Vb2Nq8Lp4Rm9Ts3Wx6Yz1Cd5Ef8Gh2Jk9Mn0Pq3Rs6Tu9Vw2Yz4
SESSION_EXPIRE_DAYS=7

# ============================================
# CORS Configuration
# ============================================
ALLOWED_ORIGINS=http://localhost:5001,http://192.168.1.107:5001

# ============================================
# Environment
# ============================================
NODE_ENV=production
```

## Session Duration Options

Choose the right session duration for your use case:

### 1 Day (High Security)

```bash
SESSION_EXPIRE_DAYS=1
```

**Best for:**

- Shared devices
- High-security requirements
- Public kiosks

**Pros:** Users must re-authenticate daily (more secure)
**Cons:** Frequent logins (less convenient)

### 7 Days (Balanced) ⭐ Recommended

```bash
SESSION_EXPIRE_DAYS=7
```

**Best for:**

- Personal devices
- Home networks
- Regular use

**Pros:** Good balance of security and convenience
**Cons:** Users stay logged in for a week

### 30 Days (Convenient)

```bash
SESSION_EXPIRE_DAYS=30
```

**Best for:**

- Personal devices only
- Trusted environments
- Infrequent use

**Pros:** Very convenient, rarely need to login
**Cons:** Less secure if device is compromised

## How to Update Configuration

### 1. Edit .env file

```bash
# Windows (Notepad)
notepad .env

# Windows (VSCode)
code .env

# Mac/Linux
nano .env
# or
vim .env
```

### 2. Restart the application

```bash
docker-compose down
docker-compose up -d
```

### 3. Verify changes

```bash
# Check environment variables in container
docker exec coffee-tracker-sync sh -c "echo \$SESSION_EXPIRE_DAYS"
```

## Configuration Priority

Docker Compose reads environment variables in this order:

1. **docker-compose.yml `environment` section** (highest priority)
2. **.env file** (via `env_file` directive)
3. **System environment variables** (lowest priority)

**Current setup:**

- `.env` file is used for all configuration
- No hardcoded values in `docker-compose.yml`
- This makes it easy to update configuration

## Troubleshooting

### Configuration not taking effect?

**Check 1:** Verify .env file is being loaded

```bash
docker exec coffee-tracker-sync sh -c "echo \$ALLOWED_ORIGINS"
```

**Check 2:** Restart container

```bash
docker-compose restart
```

**Check 3:** Rebuild container (if changing server.js)

```bash
docker-compose down
docker-compose up -d --build
```

### Session expiring too quickly?

**Check 1:** Verify SESSION_EXPIRE_DAYS is set

```bash
docker exec coffee-tracker-sync sh -c "echo \$SESSION_EXPIRE_DAYS"
```

**Check 2:** Check browser cookie expiration

- Open DevTools → Application → Cookies
- Look for `coffee.sid` cookie
- Check Expires/Max-Age value

### CORS errors after updating ALLOWED_ORIGINS?

1. Make sure there are no typos
2. Use full URLs including `http://` or `https://`
3. Separate multiple origins with commas (no spaces)
4. Restart container after changing

## Security Best Practices

### Session Configuration

✅ **DO:**

- Use strong, random SESSION_SECRET
- Set appropriate SESSION_EXPIRE_DAYS for your use case
- Keep SESSION_SECRET secret (never commit to git)

❌ **DON'T:**

- Use default/weak SESSION_SECRET in production
- Set SESSION_EXPIRE_DAYS to 365 (too long)
- Share SESSION_SECRET with anyone

### CORS Configuration

✅ **DO:**

- Use specific origins in production
- Include all your domains (with and without www)
- Test CORS after updating

❌ **DON'T:**

- Use `*` wildcard in production (insecure)
- Forget to add new domains
- Allow HTTP in production (use HTTPS only)

## Production Checklist

Before deploying to production:

- [ ] Generate strong SESSION_SECRET (not the default)
- [ ] Set appropriate SESSION_EXPIRE_DAYS
- [ ] Update ALLOWED_ORIGINS with production domain(s)
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS (required for production Facebook OAuth)
- [ ] Update Facebook OAuth redirect URIs with production URLs
- [ ] Remove any development/localhost origins

## File Permissions

Make sure your `.env` file is secure:

```bash
# Set file permissions (read/write for owner only)
chmod 600 .env

# Verify permissions
ls -la .env
# Should show: -rw------- (600)
```

## Additional Resources

- [Facebook Auth Setup](FACEBOOK_AUTH_SETUP.md)
- [Network Access Guide](NETWORK_ACCESS_GUIDE.md)
- [Security Audit](SECURITY_AUDIT.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

---

**Last Updated:** 2026-03-20
**Version:** 1.5.0
