KCSC ADMIN LAYOUT RESTORE + PAYMENT SCREENSHOT CLEANUP

Replace ONLY these files:
1. dashboard.html
2. dashboard.css
3. admin-editor.js
4. commission-admin.js
5. portal/commission-dashboard.html
6. portal/payment-success.html

WHAT IS FIXED

A) ADMIN LAYOUT RESTORE
The exact pre-performance dashboard.css is restored.
This removes the layout-affecting containment/content-visibility changes that moved/distorted:
- Services
- Actions
- Forms
- Service Charges
- All Charge
- Website CMS
- Portal Settings

Their page HTML / manager logic is NOT changed.
Dropdown, Add, Edit, Update, Delete, existing records, search/filter and manager scripts remain as before.

B) PAYMENT SCREENSHOTS REMOVED (automatic PayU is working)
Removed visible obsolete Payment Screenshot feature from:
- Admin sidebar
- Admin Payment Screenshots page
- Admin Dashboard CMS menu definition
- Commission Panel screenshot tab/listener
- Commission User dashboard screenshot card/menu/panel
- Normal User Payment Successful page manual screenshot upload

The old standalone payment-screenshots-admin.js file can remain in GitHub unused.
It is no longer loaded by dashboard.html.

C) PRESERVED
- Working PayU / Render backend
- Supabase database and Auth
- Payment Paid flow
- Commission calculation
- Commission Payment + Ledger fast delete
- Admin fast delete files
- Services / Actions / Forms CRUD
- Service Charges / All Charge
- Website CMS / Portal Settings
- Existing data
- Admin design/colors outside layout restore
- Normal User + Commission User + Admin login

No backend server.js included or changed.
