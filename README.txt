COMMISSION DASHBOARD ROUTING FINAL FIX

Replace ONLY these 3 files:

portal/account.html
portal/commission.html
portal/assets/portal.js

Final behavior:
- Commission User login -> commission.html
- Top heading -> Welcome Commission Partner
- Commission User Dashboard click -> commission.html
- Commission User brand/My Account -> commission.html
- If Commission User manually opens account.html -> automatically redirected to commission.html
- Normal User login/dashboard -> account.html exactly as before
- No PayU, Services, Charges, Forms, Admin, Applications or other working modules changed.
