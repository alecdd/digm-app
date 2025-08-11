// Handles Supabase connection
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;


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