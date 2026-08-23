COMMISSION DASHBOARD / MY COMMISSION SEPARATION FIX

Replace/add these files:

portal/commission-dashboard.html   <-- NEW real Dashboard
portal/commission.html             <-- My Commission page
portal/account.html
portal/commission-manifest.webmanifest
portal/commission-sw.js
portal/assets/portal.js
portal/assets/commission-dashboard.css
portal/assets/commission-icon-192.png
portal/assets/commission-icon-512.png

Final routing:
- Commission User login -> commission-dashboard.html
- Dashboard click -> commission-dashboard.html
- My Commission click -> commission.html
- Brand/My Account home -> commission-dashboard.html
- Normal User -> account.html unchanged
- Installed Commission App starts on commission-dashboard.html

No Admin/PayU/Services/Forms/Charges working logic changed.
