SITE-WIDE CACHE / OLD-UI FLICKER FIX

Base:
- User's current ZIP: Khobragade-Computer-Service-main(20260823-093354).zip
- Latest Commission Dashboard sidebar/install portal.js exact fix is preserved.

What is fixed:
1. Admin root Service Worker no longer intercepts/caches public website and user portal pages.
2. Admin Service Worker cache bumped and old Admin-only caches cleaned safely.
3. Admin PWA checks Service Worker updates directly from network.
4. Admin sidebar menu stays hidden until saved CMS menu is applied, so old menu does not flash first.
5. User/Commission portal old static header/sidebar are hidden while professional sidebar/header initializes.
6. Commission PWA cache bumped; critical Commission HTML/JS/CSS use network-first no-store.
7. Admin and Portal local CSS/JS URLs get a new cache-busting version.
8. Current Commission Dashboard sidebar + Install App fix is preserved.

NOT changed:
- PayU/payment logic
- Firebase rules/data
- Applications
- Forms
- Service charges / commissions
- Users
- Admin CMS logic except menu-ready visual flag
- Normal/Commission routing logic

Upload these files with the same folder paths.
