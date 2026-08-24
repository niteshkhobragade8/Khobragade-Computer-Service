ADMIN APPLICATION REALTIME + USER REGISTRATION SUCCESS FIX

Replace only:
1. supabase-db.js
2. portal/assets/portal.js
3. portal/index.html

Fixes:
- Applications refresh automatically without manual browser refresh.
- Supabase Realtime remains primary; 2.5 second fallback only for applications.
- Returning/focusing Admin tab triggers immediate Applications refresh.
- Registration no longer auto-logs in.
- After registration: "Registration successful. Please login."
- Login tab opens and registered mobile is pre-filled.
- Admin/User session isolation remains unchanged.

No PayU, Commission, Services, Forms, Charges or existing Supabase data changed.
