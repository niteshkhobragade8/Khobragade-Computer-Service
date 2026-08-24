KCSC COMMISSION FAST DELETE

Replace only:
commission-admin.js

Fix:
- Commission Payment delete disappears from UI immediately.
- Commission Ledger delete disappears from UI immediately.
- Supabase delete runs immediately after UI removal.
- If database delete fails, the row is restored and an error is shown.

No PayU/backend, commission calculation, Admin design, or Supabase data schema changed.
