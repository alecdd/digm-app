// hooks/useAuthListener.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useDigmStore } from "@/hooks/useDigmStore";
import { isAnonymousUser } from "@/lib/supa-user";

export function useAuthListener() {
  const { bumpXP, reloadAll } = useDigmStore();
  const rewardedRef = useRef(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only care about a real sign-in
        if (event !== "SIGNED_IN") return;

        const user = session?.user ?? null;
        if (!user || isAnonymousUser(user)) return; // ignore anonymous

        // Make sure Home reflects the real account immediately
        await reloadAll?.();

        // Prevent double-award within this session
        if (rewardedRef.current) return;

        try {
          const { data: p, error } = await supabase
            .from("profiles")
            .select("has_logged_in_before")
            .eq("id", user.id)
            .maybeSingle();
          if (error) throw error;

          if (!p?.has_logged_in_before) {
            rewardedRef.current = true;
            await bumpXP(250); // updates local + persists XP/level
            await supabase
              .from("profiles")
              .update({ has_logged_in_before: true })
              .eq("id", user.id);
          }
        } catch (e: any) {
          console.warn("Auth reward check failed:", e?.message || e);
        }
      }
    );

    // cleanup
    return () => subscription?.subscription?.unsubscribe?.();
  }, [bumpXP, reloadAll]);
}
