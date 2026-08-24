ADMIN / USER SESSION ISOLATION EXACT FIX

Replace ONLY:
supabase-client.js

Fix:
- Admin pages use separate Supabase auth storage.
- /portal/ User + Commission pages use separate Supabase auth storage.
- Public pages have separate auth storage.
- User registration/login can no longer replace/logout the Admin browser session.

No database, PayU, application, commission or UI logic changed.

After upload:
1. Open Admin /dashboard.html and login once again.
2. In another tab open /portal/index.html.
3. Register/login a Normal User.
4. Return to Admin tab: Admin should remain logged in.
