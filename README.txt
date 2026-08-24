KCSC ADMIN FAST DELETE + OLD PAYU PANEL REMOVE

Replace only these 4 website files:
1. dashboard.html
2. applications-admin.js
3. users-admin.js
4. payments-admin.js

Fixes:
- Old Firebase-era PayU Integration editor removed from Admin Dashboard.
- Working PayU/Render configuration is NOT changed.
- Payments page now shows only live Transaction Records.
- Application delete disappears from Admin UI immediately.
- Payment transaction delete disappears immediately.
- User delete disappears immediately.
- User cascade delete is faster: removed full publicApplicationStatus collection scan.
- User related application/payment/public status/profile cleanup runs in parallel where safe.
- If a delete actually fails, the row is restored in Admin UI and an error is shown.

No backend server.js / PayU keys / BACKEND_URL / Supabase tables are changed.
