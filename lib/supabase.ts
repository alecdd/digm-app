// lib/supabase.ts
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const sanitize = (v: string) =>
  v.replace(/["'`]/g, "").replace(/[\s\u200B-\u200D\uFEFF]/g, "");

const normalizeSupabaseUrl = (raw: string) => {
  let value = sanitize(raw || "");
  if (!value) return value;

  // If only the project ref was provided (no dots), assume *.supabase.co
  if (!value.includes(".")) {
    value = `${value}.supabase.co`;
  }
  // Ensure protocol
  try {
    // eslint-disable-next-line no-new
    new URL(value);
  } catch {
    value = `https://${value}`;
  }
  return value;
};

let supabaseUrl = normalizeSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL ?? "");
let supabaseAnonKey = sanitize(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
}
// supabaseUrl is already normalized above

console.log("[supabase] Init", {
  urlStartsWith: supabaseUrl.slice(0, 24),
  keyPreview: `${supabaseAnonKey.slice(0, 6)}...${supabaseAnonKey.slice(-6)}`
});

// Only use SecureStore on native
const nativeStorage =
  Platform.OS === "web"
    ? undefined
    : ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      } as any);

export const supabase = createClient(
  supabaseUrl!,
  supabaseAnonKey!,
  {
    auth:
      Platform.OS === "web"
        ? {
            detectSessionInUrl: true,
            autoRefreshToken: true,
            persistSession: true,
            flowType: "implicit",
          }
        : {
            detectSessionInUrl: false,
            autoRefreshToken: true,
            persistSession: true,
            flowType: "pkce",
            storage: nativeStorage,
          },
  }
);

// Test the connection after client is created
supabase.auth.getUser().then(({ data, error }) => {
  if (error) {
    console.warn("[supabase] Initial auth test failed:", error.message);
  } else {
    console.log("[supabase] Initial auth test successful, user:", data.user?.id ? "logged in" : "not logged in");
  }
}).catch(err => {
  console.error("[supabase] Initial connection test failed:", err);
});
