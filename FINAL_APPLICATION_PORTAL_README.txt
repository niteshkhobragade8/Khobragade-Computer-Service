KHOBRAGADE COMPUTER SERVICE CENTRE
APPLICATIONS + PAYMENTS TEST BUILD

BASE
- Built from final working Khobragade-Computer-Service-main(10).zip
- Existing Admin Dashboard / CMS / Website CMS modules preserved.
- No active CNAME is included in this test package. Live domain is not changed by this ZIP.

NEW ADMIN MODULES
1. Applications
2. Users / Customers
3. Payments / PayU
4. Service Actions & Forms
5. Service availability: Available / Unavailable / Coming Soon
6. Action-wise Service Charge + Official Fee
7. Dynamic Form Fields + Required Documents
8. Admin status workflow: Pending Payment / Pending / Processing / Need Documents / On Hold / Completed / Rejected / Payment Failed
9. Slip/PDF/Final File upload from Admin
10. User enable/disable

USER PORTAL
Open: /portal/index.html
- Left: Welcome Back + Khobragade Computer Service Centre + colorful computer screen
- Right: professional Login/Register card
- Registration: Full Name required, Email optional, Mobile required, Password, Confirm Password
- Login: Mobile + Password
- My Account / My Applications / Profile / Track Application
- Service actions and price live from Firestore
- Available / Unavailable / Coming Soon behavior
- Application form fields live from Admin Service Actions & Forms
- Document upload
- Application ID generation
- Payment status + application status
- Need Documents re-upload
- Completed slip/PDF/final file download

IMPORTANT USER AUTH DESIGN
Firebase does not natively provide mobile-number + password authentication.
This build securely maps the entered mobile to an internal synthetic Firebase email alias and uses Firebase Email/Password Auth. The user still sees only Mobile + Password. Password is never stored in Firestore.

SECURITY BEFORE USER TESTING
1. In Firebase Authentication, enable Email/Password provider.
2. Find the UID of your existing Admin login account.
3. In Firestore create collection: admins
4. Create document with document ID = ADMIN_UID (fields can be {role:"admin"}).
5. Publish firestore-APPLICATION-PORTAL.rules
6. Publish storage-APPLICATION-PORTAL.rules
This is required because public customer accounts are now present; ordinary signed-in customers must NOT get Admin write permissions.

PAYU
PayU Hosted Checkout is prepared but Merchant Salt/Secret is NOT placed in website JS or Firestore.
- functions/index.js contains secure backend endpoints.
- Set Firebase Functions secrets PAYU_KEY and PAYU_SALT.
- Deploy functions.
- Admin > Payments / PayU:
  Environment: test first
  Merchant Key: public identifier only
  Secure Backend Payment URL: deployed initPayuPayment URL
  Success URL + Failure URL: deployed payuCallback URL
  Portal Return URL: https://YOUR-TEST-DOMAIN/portal/my-applications.html

PayU customer-facing merchant/display name is configured in PayU Dashboard. If you do not want your personal/account-holder name visible on checkout, configure the approved business/display name in PayU. Settlement/KYC account-holder details remain with PayU and must not be faked.

PAYMENT SECURITY
- Price is re-read server-side from serviceActions before payment hash generation.
- PayU Salt stays in backend secret storage only.
- PayU response hash is checked server-side.
- Payments are audit records; permanent Delete is intentionally not provided.
- Application payment status is not trusted from browser alone.

TEST ORDER
A. Admin login
B. Services: set availability
C. Service Actions & Forms: add New Apply/Correction/Download, price, docs and fields
D. Register test customer at /portal/
E. Apply with a zero-price action first (tests application without payment)
F. Admin Applications: update status, add user message, upload slip
G. User My Applications: verify status/download
H. Configure PayU TEST credentials/backend
I. Test paid application
J. Only after all tests pass, plan domain replacement.

NOTES
- Existing current public site files remain in the package for reference/admin CMS compatibility.
- The new application portal is isolated under /portal/ for safe testing.
- Later, if approved, /portal/index.html can be promoted to the root homepage in a separate final migration step.


FINAL UI UPDATE:
- Home page now only Login/Register + professional computer welcome display.
- Services/Track/My Account navigation appears after login.
- Admin Service Actions & Forms includes direct All Service Charges manager with Edit/Update/Delete Charge (sets ₹0).
