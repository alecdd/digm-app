import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const hasValidEnv = Boolean(rawUrl) && Boolean(rawKey) && isValidUrl(rawUrl);

// Only provide custom storage on native. On web, let supabase use localStorage.
const nativeStorage: SupportedStorage | undefined =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      };

function makeEnvErrorProxy(): SupabaseClient<any, string, any> {
  const err = new Error(
    'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env or project settings.'
  );
  console.error('[supabase] Missing or invalid env. Details:', {
    EXPO_PUBLIC_SUPABASE_URL: rawUrl || '(empty)',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: rawKey ? '(provided)' : '(empty)'
  });
  return new Proxy({}, {
    get() {
      throw err;
    }
  }) as SupabaseClient<any, string, any>;
}

export const supabase: SupabaseClient<any, string, any> = hasValidEnv
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: nativeStorage,
      },
    })
  : makeEnvErrorProxy();