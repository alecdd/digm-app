// lib/supabase.ts
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const sanitize = (v: string) =>
  v.replace(/["'`]/g, "").replace(/[\s\u200B-\u200D\uFEFF]/g, "");

let supabaseUrl = sanitize(process.env.EXPO_PUBLIC_SUPABASE_URL ?? "");
let supabaseAnonKey = sanitize(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
}
try {
  // ensure https://
  // eslint-disable-next-line no-new
  new URL(supabaseUrl);
} catch {
  if (supabaseUrl && !/^https?:\/\//.test(supabaseUrl)) supabaseUrl = `https://${supabaseUrl}`;
}

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
  process.env.EXPO_PUBLIC_SUPABASE_URL!,       // ← revert to raw envs
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,  // ← revert to raw envs
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
