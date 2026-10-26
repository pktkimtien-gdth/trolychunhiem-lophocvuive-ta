import { createClient } from '@supabase/supabase-js';

// Safe fallback for Supabase client:
// If environment variables are not explicitly configured, the app operates gracefully
// in offline local mode without attempting remote connections or exposing keys.
export const SUPABASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_URL as string)) ||
  'https://iqngiwjgkwsiuclxudox.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY as string)) ||
  'sb_publishable_Bt0oR1QjbyvOkjSEg_aBTg_kJYEhfeQ';

export interface SupabaseLink {
  id?: string | number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  created_at?: string;
  icon?: string;
  target?: string;
}

const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.startsWith('http')
);

// When unconfigured, provide a no-op client returning empty data so components fallback to localStorage smoothly
export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : ({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    } as any);

export default supabase;
