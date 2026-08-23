COMMISSION USER ADMIN-ONLY FINAL FIX

Replace ONLY these 2 files in WEBSITE repository root:
1. dashboard.html
2. commission-admin.js

Final behavior:
- Commission User ONLY Admin creates from Commission Panel > Users.
- Existing normal users are never shown/selected/converted.
- Existing User dropdown removed.
- Admin can Create / Edit / Update / Active-Inactive / Delete Commission User data.
- New Commission User Firebase Authentication login is created by Admin.
- Public Register stays normal-user only.
- Commission Panel shows only isCommissionUser=true accounts.
- Latest Commission Services behavior preserved:
  Current Service Charge read-only
  Set Commission / Update / Delete
  Fixed ₹ / Percentage %
  Active / Inactive
  Final charge preview
- Delete Commission User removes Firestore profile + commission rates + ledger.
- On Spark/free setup, Firebase Authentication login must still be deleted manually in Firebase Console if permanent login removal is required.
- No other working modules changed.
