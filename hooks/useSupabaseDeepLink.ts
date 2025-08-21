// hooks/useSupabaseDeepLink.ts
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

export function useSupabaseDeepLink() {
  useEffect(() => {
    const handle = async (url: string) => {
      try {
        // PKCE: code in query
        const u = new URL(url);
        const code = u.searchParams.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          return;
        }

        // Implicit: tokens in hash
        if (u.hash?.includes("access_token")) {
          const params = new URLSearchParams(u.hash.replace(/^#/, ""));
          const access_token = params.get("access_token") || "";
          const refresh_token = params.get("refresh_token") || "";
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      } catch (e) {
        console.warn("[deep-link] session exchange failed", e);
      }
    };

    // cold start
    Linking.getInitialURL().then((url) => {
      if (url) handle(url);
    });

    // foreground events — type the event param and guard cleanup
    const sub = Linking.addEventListener("url", (e: { url: string }) => {
      handle(e.url);
    });

    return () => {
      sub?.remove?.();
    };
  }, []);
}
