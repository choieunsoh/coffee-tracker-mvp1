# Facebook Authentication Setup Guide

This guide walks you through setting up Facebook OAuth authentication for the Coffee Tracker app.

## Implementation Approach

**This app uses server-side OAuth flow** with Passport.js, NOT the Facebook JavaScript SDK.

**Why Server-Side?**
- ✅ More secure (app secret never exposed to client)
- ✅ Industry standard for session-based authentication
- ✅ Simpler to maintain and debug
- ✅ Better error handling

**What This Means:**
- No `react-facebook-login` library needed
- OAuth flow uses HTTP redirects (handled by Passport.js)
- Session stored in httpOnly cookies (secure)
- Frontend just checks auth status via API

**Permissions Used:**
- `public_profile` (basic user info - no app review needed)
- NOT `email` (requires Facebook approval and app review)

## Prerequisites

- A Facebook account (for creating the Facebook App)
- Docker and Docker Compose installed

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Consumer"** as the app type
4. Enter an app name (e.g., "Coffee Tracker")
5. Click **"Create App"**

## Step 2: Configure Facebook Login

1. In your app dashboard, find **"Add a product"** section
2. Click **"Set up"** on **"Facebook Login"**
3. Skip the quick start (click "Finish" or "Skip")

## Step 3: Configure OAuth Settings

1. In the left sidebar, go to **"Facebook Login"** → **"Settings"**
2. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   http://localhost:5001/api/auth/facebook/callback
   ```
3. Click **"Save changes"**

## Step 4: Configure Basic Settings

1. In the left sidebar, go to **"Settings"** → **"Basic"**
2. Fill in the following:
   - **App Domains**: `localhost`
   - **Site URL**: `http://localhost:5001`
   - **Privacy Policy URL**: (optional for development)
3. Click **"Save changes"**

## Step 5: Get App Credentials

1. In the left sidebar, go to **"Settings"** → **"Basic"**
2. Copy the **App ID** and **App Secret**
3. Keep these safe - you'll need them for the next step

## Step 6: Generate Session Secret

Run this command to generate a secure random session secret:

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
-rand -base64 32
```

## Step 7: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Facebook OAuth Credentials
FACEBOOK_APP_ID=your_actual_app_id_here
FACEBOOK_APP_SECRET=your_actual_app_secret_here

# Session Secret (use the value from Step 6)
SESSION_SECRET=your_generated_session_secret_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5001

# Environment
NODE_ENV=production
```

### Example `.env` file:

```bash
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abc123def456ghi789jkl012mno345pq
SESSION_SECRET=Kx7Vb2Nq8Lp4Rm9Ts3Wx6Yz1Cd5Ef8Gh2Jk9Mn0Pq3Rs6Tu9Vw2Yz4
ALLOWED_ORIGINS=http://localhost:5001
NODE_ENV=production
```

## Step 8: Update .env.example

Update your `.env.example` file to include the new variables:

```bash
# Facebook OAuth Credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# Session Secret
SESSION_SECRET=your-random-session-secret-here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5001

# Environment
NODE_ENV=production
```

## Step 9: Restart Application

```bash
# Stop the current containers
docker-compose down

# Rebuild and start with new environment variables
docker-compose up --build -d

# View logs to verify everything is working
docker-compose logs -f
```

## Step 10: Test Authentication

1. Open http://localhost:5001 in your browser
2. You should see the login page with "Continue with Facebook" button
3. Click the button
4. Complete the Facebook OAuth flow
5. You should be redirected back to the app, logged in
6. Your existing coffee entries should appear (migrated to your account)

**Important Notes:**
- This implementation uses **server-side OAuth flow** (not Facebook JavaScript SDK)
- We use `public_profile` scope (not `email`) to avoid Facebook app review
- Session cookies are used for authentication (httpOnly, secure, sameSite)
- All API requests include `credentials: 'include'` to send session cookies

## Troubleshooting

### "App Not Setup" Error

**Problem**: Facebook shows "The app's configuration is invalid" error.

**Solution**:
- Verify the OAuth Redirect URI matches exactly: `http://localhost:5001/api/auth/facebook/callback`
- Make sure App Domains includes `localhost`
- Check that Site URL is set to `http://localhost:5001`

### "CORS Not Allowed" Error

**Problem**: Browser shows CORS error when trying to login.

**Solution**:
- Verify `ALLOWED_ORIGINS` in `.env` includes `http://localhost:5001`
- Make sure there are no trailing slashes or spaces

### "Authentication Required" Error

**Problem**: API returns 401 errors after login.

**Solution**:
- Check that session cookies are being set (browser DevTools → Application → Cookies)
- Verify `SESSION_SECRET` is set correctly
- Clear browser cookies and try again

### Existing Entries Not Showing

**Problem**: First user doesn't see existing coffee entries.

**Solution**:
- Check server logs for migration message: `"Migrating existing data to user: facebook:..."`
- Verify `data/coffee-data.json` has `userId` field on all entries
- Try logging out and back in

## Security Considerations

### Development vs Production

**Development (localhost)**:
- HTTP is acceptable
- Use test Facebook App

**Production**:
- MUST use HTTPS
- MUST update Facebook OAuth settings with production URLs
- MUST use strong, randomly generated secrets
- SHOULD restrict Facebook App to specific domains

### Best Practices

1. **Never commit `.env` to git** - it's already in `.gitignore`
2. **Use different apps** for development and production
3. **Rotate secrets periodically** - especially if compromised
4. **Monitor Facebook App dashboard** for unusual activity
5. **Keep dependencies updated** - `bun update` regularly

## Data Migration

When the first user logs in, all existing coffee entries (without `userId`) will be automatically migrated to that user's account. This happens:

1. After successful Facebook OAuth callback
2. Only once (entries with `userId` are skipped)
3. With a console log message: `"Migrating existing data to user: facebook:..."`

Subsequent users will start with an empty list and only see their own entries.

## Multi-User Testing

To test multi-user functionality:

1. Login with Facebook Account A
2. Add a coffee entry
3. Logout
4. Login with Facebook Account B
5. Verify you DON'T see Account A's entry
6. Add a coffee entry for Account B
7. Logout
8. Login back to Account A
9. Verify you only see Account A's entries

## Next Steps

After authentication is working:

1. [ ] Test all functionality (add, delete entries)
2. [ ] Test logout and login flow
3. [ ] Test with multiple Facebook accounts
4. [ ] Update deployment documentation
5. [ ] Consider adding password reset (handled by Facebook)
6. [ ] Consider adding user profile editing

## Additional Resources

- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login/oauth)
- [Passport.js Facebook Strategy](http://www.passportjs.org/packages/passport-facebook/)
- [Express Session Documentation](https://github.com/expressjs/session)

## Support

If you encounter issues:

1. Check the server logs: `docker-compose logs -f`
2. Check browser console for JavaScript errors
3. Verify Facebook App settings match the guide exactly
4. Ensure all environment variables are set correctly
5. Try clearing browser cookies and data

---

**Last Updated:** 2026-03-20
**Version:** 1.5.0 (with Facebook Authentication)
