MIGRATION PAGE AUTH FIX ONLY

Replace ONLY:
supabase-migrate.html

Why:
- Firestore Rules are already correct.
- Old migration page created a second Firebase app without Admin Auth session.
- Public collections copied, but protected users collection failed.
- Fixed page uses the existing authenticated default Firebase app.

After replacing:
1. Admin login karo.
2. Open /supabase-migrate.html
3. Start Safe Migration again.
4. Already copied documents will safely upsert/overwrite same IDs in Supabase.
5. Firebase original data remains untouched.
