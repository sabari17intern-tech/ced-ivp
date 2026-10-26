import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient = null;

try {
  if (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.startsWith('YOUR_') &&
    !SUPABASE_URL.startsWith('https://your-project')
  ) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'ced-grant-react-pwa' } }
    });
  } else {
    console.info('Supabase: No valid credentials found in .env — running in local-only mode.');
  }
} catch (e) {
  console.warn('Supabase initialization fallback to local mode:', e);
  supabaseClient = null;
}

export const supabase = supabaseClient;

export async function checkSupabaseHealth() {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient.from('ivp_app_state').select('id').eq('id', 1).maybeSingle();
    return !error;
  } catch (e) {
    return false;
  }
}
