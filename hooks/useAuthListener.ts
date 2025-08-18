// hooks/useAuthListener.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useDigmStore } from "@/hooks/useDigmStore";
import { isAnonymousUser } from "@/lib/supa-user";

// Turn this on later if you want to re-enable the reward.
const LOGIN_REWARD_ENABLED = false;

export function useAuthListener() {
  const { bumpXP, reloadAll } = useDigmStore();
  const handledRef = useRef(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN") return;

      const user = session?.user ?? null;
      if (!user || isAnonymousUser(user)) return;

      // Make sure Home reflects the real account immediately
      await reloadAll?.();

      // Prevent duplicate work in a single runtime
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        // Check first-login flag
        const { data: prof, error } = await supabase
          .from("profiles")
          .select("has_logged_in_before")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;

        if (!prof?.has_logged_in_before) {
          // Mark as seen so we don't evaluate again
          await supabase
            .from("profiles")
            .update({ has_logged_in_before: true })
            .eq("id", user.id);

          // Disabled: no XP/level up on first login
          if (LOGIN_REWARD_ENABLED) {
            await bumpXP(250);
          }
        }
      } catch (e: any) {
        console.warn("Auth listener post-login work failed:", e?.message || e);
      }
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, [bumpXP, reloadAll]);
}
