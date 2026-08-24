KCSC FINAL PAYU v5.0

Root cause hardening:
PayU /payment-success and /payment-failure are intercepted at Node HTTP server level,
BEFORE Express. Express routing can no longer produce "Not Found" for these URLs.

Backend source in this website ZIP and _NEW_SUPABASE_RENDER_BACKEND is synchronized
with the standalone backend ZIP to prevent old v3/v4 files from being redeployed.

Payment success page has no manual screenshot upload section.

Render expected:
Build Command: npm install
Start Command: npm start (or node server.js)
Root Directory: blank
Environment:
WEBSITE_URL=https://9637832490.online
BACKEND_URL=https://kcc-supabase-backend.onrender.com
PAYU_MODE=production
plus existing PAYU/Supabase keys.
