PASSWORD RESET FULL FLOW FINAL

WEBSITE:
- Admin Login: Show/Hide existing + Forgot Password email reset.
- Normal/Commission Login & Register: Show/Hide password.
- Forgot Password by mobile -> Admin Dashboard request.
- Admin Dashboard > Password Reset Requests.
- Admin sets Temporary Password.
- Next user login is forced to Change Password.
- New permanent password is saved only in Firebase Authentication.
- Commission User Create password field gets Show/Hide too.

BACKEND:
Replace kcc-payu-backend/server.js and redeploy Render.
Existing PayU + commission backend logic is preserved.

No Cloud Functions/Blaze required.
