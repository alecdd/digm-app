// Handles Supabase connection
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const sanitize = (v: string) => v.replace(/["'`]/g, '').replace(/[\s\u200B-\u200D\uFEFF]/g, '');
const rawUrl = sanitize((process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''));
const rawKey = sanitize((process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''));

let supabaseUrl = rawUrl;
let supabaseAnonKey = rawKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

try {
  // Validate URL early to avoid runtime crash inside supabase-js
  // eslint-disable-next-line no-new
  new URL(supabaseUrl);
} catch (e) {
  console.error('[supabase] Invalid SUPABASE URL provided. Value:', supabaseUrl);
  // Attempt a minimal fix: ensure it starts with https://
  if (supabaseUrl && !/^https?:\/\//.test(supabaseUrl)) {
    supabaseUrl = `https://${supabaseUrl}`;
    try {
      // eslint-disable-next-line no-new
      new URL(supabaseUrl);
    } catch (e2) {
      console.error('[supabase] URL still invalid after sanitize:', supabaseUrl);
    }
  }
}

console.log('[supabase] Init', { urlStartsWith: supabaseUrl.slice(0, 24), keyPreview: `${supabaseAnonKey.slice(0, 6)}...${supabaseAnonKey.slice(-6)}` });

// Only provide custom storage on native. On web, let supabase use localStorage.
const nativeStorage =
  Platform.OS === 'web'
    ? undefined
    : ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      } as any);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: nativeStorage, // undefined on web = use localStorage
  },
});