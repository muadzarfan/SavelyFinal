import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from import.meta.env or localStorage custom settings
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  // Also check if user set custom credentials in browser
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('savely_supabase_url') || '' : '';
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('savely_supabase_key') || '' : '';

  const activeUrl = customUrl || envUrl;
  const activeKey = customKey || envKey;

  return {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured: Boolean(activeUrl && activeKey),
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('savely_supabase_url', url.trim());
    localStorage.setItem('savely_supabase_key', key.trim());
    supabaseInstance = null; // reset so it re-initializes on next call
  }
}
