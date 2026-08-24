KCSC ADMIN LAYOUT FINAL FIX

Replace ONLY:
1) dashboard.html
2) dashboard.css

FIXED:
- Removes the broken application-style wrapper patch that squeezed Forms and disturbed manager pages.
- Restores the valid pre-layout HTML structure.
- Services / Actions / Forms / Service Charges / All Charge / Website CMS / Portal Settings IDs and mounts preserved.
- CSS cache version changed so Chrome loads corrected layout immediately.

NOT CHANGED:
- JavaScript
- Supabase/backend
- PayU working flow
- Commission logic
- User/Admin logic
- Delete/update/dropdown functions
- Existing database data

After upload open dashboard and press Ctrl+F5 once.
