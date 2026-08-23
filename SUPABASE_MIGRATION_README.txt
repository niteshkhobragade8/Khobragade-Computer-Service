SUPABASE DATABASE MIGRATION - SAFE ROLLBACK MODE

IMPORTANT ARCHITECTURE
- Existing Firebase project stays untouched.
- Existing kcc-payu-backend Render service/repo stays untouched.
- Existing Supabase website/project stays untouched.
- Create a NEW Supabase project for Computer Service Centre.
- Create a NEW private GitHub backend repo + NEW Render service for the Supabase version.

This version replaces Firebase FIRESTORE with Supabase.
Firebase Authentication is intentionally preserved so current Admin/User/Commission
accounts and passwords keep working without re-registration.

After the new Supabase version is verified, you may keep the old Firebase/Render
version indefinitely as rollback backup.

One-time data copy:
supabase-migrate.html copies Firestore documents to the NEW Supabase project.
It never deletes the Firebase originals.
