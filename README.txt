COMMISSION USER SEPARATION + LOGIN FINAL FIX

Replace only:
ROOT:
- users-admin.js
- dashboard.js

PORTAL:
- portal/index.html
- portal/assets/portal.js

Result:
- Normal Users / Customers list excludes Commission Users.
- Total Users count excludes Commission Users.
- Commission User login opens commission.html.
- Normal User login still opens account.html.
- Public registration still creates normal users only.
- No other working modules changed.
