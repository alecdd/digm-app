// hooks/useAuthListener.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useDigmStore } from "@/hooks/useDigmStore";
import { isAnonymousUser } from "@/lib/supa-user";

// Turn this on later if you want to re-enable the reward.
const LOGIN_REWARD_ENABLED = false;

export function useAuthListener() {
  const { bumpXP, reloadAll, reset } = useDigmStore();

  // Track the last UID we've seen so we can react to anon → real (or user swaps)
  const lastUid = useRef<string | null>(null);
  // Prevent repeating the first-login check/XPs for the same UID
  const rewardedUid = useRef<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      const uid = user?.id ?? null;
      const anon = isAnonymousUser(user);

      // UID changed (includes anon → real, real → null on sign-out)
      if (uid !== lastUid.current) {
        lastUid.current = uid;

        // tiny yield so Supabase applies the new session before we refetch
        await new Promise((r) => setTimeout(r, 30));

        if (!uid) {
          // Signed out → clear memory; don't fetch
          reset?.();
          return;
        }

        if (!anon) {
          // Only fetch for real accounts
          await reloadAll?.();
        }
        // For anonymous sessions we skip reloads to avoid noise / loops
      }

      // Explicit sign-out event: make sure memory is clean (no refetch)
      if (event === "SIGNED_OUT") {
        reset?.();
        return;
      }

      // First-login bookkeeping for real users only
      if (event === "SIGNED_IN" && uid && !anon && rewardedUid.current !== uid) {
        rewardedUid.current = uid;
        try {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("has_logged_in_before")
            .eq("id", uid)
            .maybeSingle();
          if (error) throw error;

          if (!prof?.has_logged_in_before) {
            await supabase
              .from("profiles")
              .update({ has_logged_in_before: true })
              .eq("id", uid);

            if (LOGIN_REWARD_ENABLED) {
              await bumpXP?.(250);
            }
          }
        } catch (e) {
          console.warn("Auth listener post-login work failed:", e);
        }
      }
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, [bumpXP, reloadAll, reset]);
}
