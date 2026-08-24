KCSC LIVE READY BUILD V22

Base: V21 passed Resubmit/Documents tests.
Preserved: PayU working payment flow, separate admin/user auth sessions, service catalogue, CMS/admin controls.
Live-ready cleanup added:
- Profile/autofill preserved
- My Documents now shows actual uploaded files with Open/Download
- Downloads now shows actual completed/final files
- Notifications now includes Need Documents, Rejected, Completed, Payment Failed, Admin message actions
- Payments now shows payment status, amount, transaction ID and Pay Now when pending
- Dashboard alert includes rejected/resubmit cases
- Cache version bumped to 20260821-live22
- database rules from V21 preserved

DO NOT put PayU Salt or Supabase service-account JSON in this GitHub website repository.
Render backend remains separate.
After upload: hard refresh once, login, check Dashboard/Profile/My Documents/Payments/Notifications.
