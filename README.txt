KCSC COMMISSION INVALID DATE + GITHUB PAYMENT PAGE RETRY FIX

Replace only:
1. commission-admin.js
2. portal/assets/portal.js

Fix 1:
- Commission Payments date now supports:
  Supabase ISO dates
  Firestore {seconds,nanoseconds}
  {_seconds,_nanoseconds}
- Invalid date shows — instead of "Invalid Date".

Fix 2:
- Before opening portal/payment.html after application submit,
  the portal checks that GitHub Pages is actually returning the HTML page.
- If GitHub Pages temporarily returns its Unicorn/error page,
  it retries up to 4 times before navigating.
- Existing payment/PayU logic is untouched.

No backend, PayU keys, commission calculation, database data, or Admin design changed.
