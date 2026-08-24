import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

function validConfig(){
  return /^https:\/\/.+\.supabase\.co\/?$/i.test(String(SUPABASE_URL||'')) &&
    !String(SUPABASE_ANON_KEY||'').startsWith('PASTE_') && String(SUPABASE_ANON_KEY||'').length>20;
}
if(!validConfig()) console.warn('Supabase browser config pending: supabase-config.js');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'kcsc-supabase-auth'
  },
  realtime: { params: { eventsPerSecond: 8 } }
});
