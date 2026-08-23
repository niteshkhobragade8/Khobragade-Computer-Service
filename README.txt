COMMISSION FINAL - BULK DIFFERENT SERVICE COMMISSION

Replace these files in WEBSITE repository:

ROOT:
- dashboard.html
- commission-admin.js
- users-admin.js
- dashboard.js

PORTAL:
- portal/index.html
- portal/assets/portal.js

What this adds/fixes:
- Commission User only Admin creates.
- Existing normal users are not Commission Users.
- Normal Users/Customers list excludes Commission Users.
- Commission User login opens commission.html.
- Commission Panel > Services shows all existing services/actions.
- Current Service Charge is read-only.
- Each service/action can have a DIFFERENT commission amount/type.
- Example: Service A ₹10, Service B ₹25, Service C 5%, Service D ₹40.
- Set all different values on one screen, then press ONE button:
  Save All Commission Changes
- Only changed rows are written.
- Individual Set/Update/Delete remains available.
- Base service charges are never changed by Commission Panel.
- No other working modules changed.
