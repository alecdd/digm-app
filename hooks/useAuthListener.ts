// hooks/useAuthListener.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useDigmStore } from "@/hooks/useDigmStore";

export function useAuthListener() {
  const { bumpXP } = useDigmStore();
  const rewardedRef = useRef(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" || !session?.user || rewardedRef.current) return;

      // check flag
      const { data: p, error } = await supabase
        .from("profiles")
        .select("has_logged_in_before")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) return;

      if (!p?.has_logged_in_before) {
        rewardedRef.current = true;
        await bumpXP(250); // this updates level in the store + persists xp/level to profiles

        // set the flag so it never double-awards
        await supabase.from("profiles")
          .update({ has_logged_in_before: true })
          .eq("id", session.user.id);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);
}
