import { auth } from '../../supabase-auth.js';
import { getDatabase } from '../../supabase-db.js';
export { auth };
export const db=getDatabase();
