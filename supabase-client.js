import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

function validConfig(){
  return /^https:\/\/.+\.supabase\.co\/?$/i.test(String(SUPABASE_URL||'')) &&
    !String(SUPABASE_ANON_KEY||'').startsWith('PASTE_') && String(SUPABASE_ANON_KEY||'').length>20;
}
if(!validConfig()) console.warn('Supabase browser config pending: supabase-config.js');

// Keep Admin and User/Commission browser sessions completely separate.
// This prevents a User registration/login in /portal/ from replacing the Admin session.
const pathName = String(location.pathname || '').toLowerCase();
const adminPages = new Set(['/login.html','/dashboard.html','/admin.html']);
const isPortal = pathName.includes('/portal/');
const isAdminArea = adminPages.has(pathName) || pathName.endsWith('/login.html') || pathName.endsWith('/dashboard.html') || pathName.endsWith('/admin.html');
const authScope = isPortal ? 'portal' : (isAdminArea ? 'admin' : 'public');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: `kcsc-supabase-auth-${authScope}`
  },
  realtime: { params: { eventsPerSecond: 8 } }
});
