// hooks/useAuthListener.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useDigmStore } from "@/hooks/useDigmStore";

const LOGIN_REWARD_ENABLED = false;

export function useAuthListener() {
  const { bumpXP, reloadAll, reset } = useDigmStore();

  // keep latest function refs so the effect can be [] (subscribe once)
  const reloadAllRef = useRef(reloadAll);
  const resetRef = useRef(reset);
  const bumpXPRef = useRef(bumpXP);
  useEffect(() => { reloadAllRef.current = reloadAll; }, [reloadAll]);
  useEffect(() => { resetRef.current = reset; }, [reset]);
  useEffect(() => { bumpXPRef.current = bumpXP; }, [bumpXP]);

  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null;
      // console.log("[auth]", event, "uid:", uid);

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
        lastUid.current = uid;
        // tiny yield so supabase-js applies new session before fetching
        await new Promise((r) => setTimeout(r, 30));
        await reloadAllRef.current?.();
      }

      // Optional first-login reward (kept here; won’t affect reload loop)
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
