import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://iqngiwjgkwsiuclxudox.supabase.co';

const supabaseAnonKey: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_Bt0oR1QjbyvOkjSEg_aBTg_kJYEhfeQ';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
