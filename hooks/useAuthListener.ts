// hooks/useAuthListener.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const LOGIN_REWARD_ENABLED = false;

export function useAuthListener(storeFunctions?: {
  bumpXP?: (amount: number) => Promise<void>;
  reloadAll?: () => Promise<void>;
  reset?: () => void;
}) {
  // keep latest function refs so the effect can be [] (subscribe once)
  const reloadAllRef = useRef(storeFunctions?.reloadAll);
  const resetRef = useRef(storeFunctions?.reset);
  const bumpXPRef = useRef(storeFunctions?.bumpXP);
  
  useEffect(() => { 
    reloadAllRef.current = storeFunctions?.reloadAll; 
  }, [storeFunctions?.reloadAll]);
  
  useEffect(() => { 
    resetRef.current = storeFunctions?.reset; 
  }, [storeFunctions?.reset]);
  
  useEffect(() => { 
    bumpXPRef.current = storeFunctions?.bumpXP; 
  }, [storeFunctions?.bumpXP]);

  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null;
      console.log("[auth]", event, "uid:", uid);

      if (event === "SIGNED_OUT") {
        lastUid.current = null;
        resetRef.current?.();      // clear in-memory store once
        return;
      }

      const shouldReload =
        (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
        !!uid &&
        uid !== lastUid.current;

      if (shouldReload) {
        // Clear any cached data from a previous user before loading the new one
        resetRef.current?.();
        lastUid.current = uid;
        await new Promise((r) => setTimeout(r, 75));
        try {
          await reloadAllRef.current?.();
        } catch (e) {
          console.error("Failed to reload data after auth:", e);
        }
      }

      // Optional first-login reward (kept here; won't affect reload loop)
      if (LOGIN_REWARD_ENABLED && event === "SIGNED_IN" && uid) {
        try {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("has_logged_in_before")
            .eq("id", uid)
            .maybeSingle();
          if (!error && !prof?.has_logged_in_before) {
            await supabase.from("profiles").update({ has_logged_in_before: true }).eq("id", uid);
            await bumpXPRef.current?.(250);
          }
        } catch (e) {
          console.warn("post-login reward failed:", e);
        }
      }
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []); // <-- subscribe exactly once
}
