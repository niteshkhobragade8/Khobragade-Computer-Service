KCSC ADMIN SELECTED PAGES LAYOUT — CSS ONLY

I first checked the current layout structure of:
- Dashboard
- Commission Panel
- Applications
- Users / Customers

The common safe pattern is: full available Admin content width, with cards/tables/forms not squeezed into a narrow left column.

Replace ONLY:
dashboard.css

Target pages:
- Services
- Actions
- Forms
- Service Charges
- All Charge
- Website CMS
- Portal Settings

What this patch does:
- Changes only the selected pages' layout CSS.
- Their .manager-layout becomes one full-width column.
- Forms, existing records, cards and tables use full available width.
- Required Documents section on Forms also becomes full width.

What this patch DOES NOT change:
- dashboard.html
- any JavaScript
- dropdowns
- Add/Edit/Update/Delete
- existing records/data
- Services -> Actions -> Forms linkage
- charges
- PayU/backend
- Supabase/Auth
- Admin/Commission/User logic
- fast delete
- any other Admin page

After upload: Ctrl+F5 once.
