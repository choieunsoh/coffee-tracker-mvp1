# Security Configuration Guide

This document explains how to configure the security features implemented in Phase 2.

## Overview

Phase 2 implements two critical security features:

1. **Rate Limiting** - Prevents API abuse
2. **API Key Authentication** - Controls access to your API

---

## 1. Rate Limiting

### What It Does

Rate limiting prevents abuse by limiting the number of requests a client can make in a time window.

### Default Configuration

```javascript
windowMs: 15 * 60 * 1000  // 15 minutes
max: 100                   // Max 100 requests per 15 minutes
```

### How It Works

- Each IP address is tracked separately
- After 100 requests in 15 minutes, further requests return **429 Too Many Requests**
- Rate limit resets automatically after 15 minutes
- Static files (assets, favicon) are not rate limited

### Response When Rate Limited

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Headers

Rate limit info is included in response headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1679089200000
```

### Customization

To change rate limits, edit `server.js`:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window
  max: 100,                   // Max requests per window
  message: 'Custom message',
});
```

### Disabling Rate Limiting

⚠️ **Not recommended** - Only disable for testing:

```javascript
// Comment out in server.js
// app.use('/api/', apiLimiter);
```

---

## 2. API Key Authentication

### What It Does

API key authentication requires clients to provide a secret key to access the API.

### Default Behavior

**By default, API key authentication is DISABLED** for convenience.

- If `API_KEY` environment variable is not set: **Open access** (anyone can use API)
- If `API_KEY` environment variable is set: **Protected** (requires valid API key)

### How to Enable API Key Authentication

#### Option 1: Environment Variable (Recommended)

```bash
# Set API key
export API_KEY="your-secret-api-key-here"
bun run start
```

#### Option 2: Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  coffee-tracker:
    environment:
      - API_KEY=your-secret-api-key-here
```

#### Option 3: .env File (Not in git)

Create `.env` file (already in `.gitignore`):

```bash
API_KEY=your-secret-api-key-here
```

### How to Use API Key

Once enabled, clients must include the API key in requests:

```bash
# Using curl
curl -H "x-api-key: your-secret-api-key-here" \
  http://localhost:5001/api/entries

# Using fetch
fetch('http://localhost:5001/api/entries', {
  headers: {
    'x-api-key': 'your-secret-api-key-here'
  }
})
```

### Response When Unauthorized

**Missing API key:**
```json
{
  "error": "Unauthorized: API key required"
}
```
**Status:** 401 Unauthorized

**Invalid API key:**
```json
{
  "error": "Forbidden: Invalid API key"
}
```
**Status:** 403 Forbidden

### Generating a Secure API Key

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Example output:
# a1b2c3d4e5f6... (64 character hex string)
```

### Best Practices

✅ **DO:**
- Use long, random API keys (32+ characters)
- Store API keys in environment variables
- Rotate API keys periodically
- Use different keys for development/production
- Keep API keys secret (never commit to git)

❌ **DON'T:**
- Use simple passwords like "password123"
- Hardcode API keys in source code
- Share API keys in public repositories
- Use the same key across multiple applications

---

## 3. Combined Security Setup

### Recommended Production Configuration

```bash
# .env file (NOT in git)
API_KEY=your-production-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NODE_ENV=production
```

```bash
# Start server with security
bun run start
```

### Security Layers

With Phase 2, your API has **3 layers of protection**:

1. **CORS** - Only allows requests from whitelisted origins
2. **Rate Limiting** - Prevents abuse from any single IP
3. **API Key** - Ensures only authorized clients can access

---

## 4. Testing Security Features

### Test Rate Limiting

```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl http://localhost:5001/api/entries
done

# Should see rate limit error after 100 requests
```

### Test API Key Authentication

```bash
# Without API key (when API_KEY is set)
curl http://localhost:5001/api/entries
# Returns: 401 Unauthorized

# With wrong API key
curl -H "x-api-key: wrong-key" http://localhost:5001/api/entries
# Returns: 403 Forbidden

# With correct API key
curl -H "x-api-key: your-secret-api-key-here" http://localhost:5001/api/entries
# Returns: 200 OK with data
```

### Test CORS

```bash
# Test from allowed origin
curl -H "Origin: http://localhost:3001" http://localhost:5001/api/entries

# Test from blocked origin
curl -H "Origin: http://evil-site.com" http://localhost:5001/api/entries
# Should fail or not include CORS headers
```

---

## 5. Development vs Production

### Development (Default)

```bash
# No API key required
# CORS allows localhost
# Rate limiting enabled but lenient
bun run start
```

### Production (Recommended)

```bash
# Set environment variables
export API_KEY="your-secret-key"
export ALLOWED_ORIGINS="https://yourdomain.com"
export NODE_ENV="production"

# Start server
bun run start
```

### Docker Production

Update `docker-compose.yml`:

```yaml
services:
  coffee-tracker:
    environment:
      - API_KEY=${API_KEY}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - NODE_ENV=production
```

Run with:

```bash
API_KEY="your-secret-key" ALLOWED_ORIGINS="https://yourdomain.com" docker-compose up
```

---

## 6. Troubleshooting

### "Too Many Requests" Error

**Problem:** You're being rate limited

**Solutions:**
- Wait 15 minutes for rate limit to reset
- Increase rate limit in `server.js` if needed for development
- Use different IP addresses for testing

### "Unauthorized: API Key Required" Error

**Problem:** API key is set but not provided

**Solutions:**
- Add `x-api-key` header to requests
- Check that `API_KEY` environment variable is set
- Verify API key is correct

### CORS Errors

**Problem:** Request blocked by CORS policy

**Solutions:**
- Add your origin to `ALLOWED_ORIGINS`
- Check that CORS headers are being sent
- Verify origin matches exactly (including protocol)

### Static Files Not Loading

**Problem:** Assets are being rate limited

**Solution:** Already handled - static files skip rate limiting automatically

---

## 7. Monitoring

### Check Rate Limit Status

```bash
# View rate limit headers
curl -I http://localhost:5001/api/entries

# Look for:
# RateLimit-Limit: 100
# RateLimit-Remaining: 95
# RateLimit-Reset: 1679089200000
```

### Log Suspicious Activity

Rate limiting and authentication attempts are logged. Monitor logs for:

- Many 401 errors (invalid API keys) → Possible attack
- Many 429 errors (rate limits) → Abusive client
- Requests from unknown origins → CORS violations

---

## 8. Security Checklist

Before deploying to production:

- [ ] API key authentication enabled
- [ ] Strong API key generated (32+ characters)
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Tested all security layers
- [ ] Environment variables properly set
- [ ] `.env` file in `.gitignore`
- [ ] No secrets in source code
- [ ] Documentation updated

---

**Last Updated:** 2026-03-20
**Phase:** 2 of 4 (High Priority)
**Status:** ✅ Complete

See [`.docs/SECURITY_AUDIT.md`](SECURITY_AUDIT.md) for full security roadmap.
