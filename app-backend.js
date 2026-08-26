// Supabase compatibility entry used by existing Admin/CMS modules.
// Keeps the old import path without Firebase or Render proxy calls.
import { getDatabase } from './supabase-db.js';
import { auth } from './supabase-auth.js';

export const db = getDatabase();
export { auth };
