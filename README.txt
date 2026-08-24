KCSC 7 ADMIN PAGES EXACT FULL-WIDTH LAYOUT

Replace ONLY:
dashboard.html

ONLY these pages are affected:
- Services
- Actions
- Forms
- Service Charges
- All Charge
- Website CMS
- Portal Settings

Reference:
Dashboard / Commission Panel / Applications / Users-Customers full-width Admin layout.

Important:
- dashboard.css NOT replaced
- NO JavaScript changed
- NO User pages changed
- NO Commission User pages changed
- NO other Admin pages changed
- PayU / Supabase / backend / login / delete / update / dropdown logic untouched
- Existing IDs and records unchanged

The fix is an inline, ID-scoped CSS block loaded after dashboard.css,
so browser cache cannot prevent it from applying.
