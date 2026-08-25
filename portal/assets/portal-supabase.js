import { auth } from '../../supabase-auth.js';
import { getDatabase } from '../../supabase-compat.js';
export { auth };
export const db = getDatabase();
