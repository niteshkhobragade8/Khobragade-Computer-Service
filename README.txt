KCSC ADMIN GLOBAL PERFORMANCE FIX

Replace only:
1. supabase-db.js
2. menu.js
3. dashboard.js
4. dashboard.css

Performance fixes:
- Identical Supabase requests are deduplicated while in-flight.
- Multiple modules watching the same collection no longer create duplicate simultaneous fetches.
- Realtime bursts are debounced.
- Old 8-second polling across every Admin collection reduced:
  applications/payments/users/commission = 20 sec fallback
  other dynamic = 60 sec
  static CMS = 180 sec
  Supabase Realtime remains primary.
- Initial onSnapshot uses cache when available instead of forced re-fetch.
- Sidebar page switch changes only current/target page, not every page/menu item.
- Dashboard listeners are not recreated on every Dashboard click.
- Smooth scrolling/page animation removed from Admin page switching.
- Large grids/tables use browser content-visibility optimization.

NOT CHANGED:
- PayU/backend configuration
- Payment status logic
- Fast delete logic
- Commission calculations
- Admin colors/design/layout
- Supabase data
