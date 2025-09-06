// hooks/useAuthListener.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        lastUid.current = uid;
        // Wait a bit longer to ensure the store is properly initialized
        await new Promise((r) => setTimeout(r, 100));
        try {
          await reloadAllRef.current?.();
        } catch (e) {
          console.error("Failed to reload data after auth:", e);
        }

        // Welcome video gating
        try {
          const userId = session?.user?.id;
          if (!userId) return;
          // One-time suppression guard (e.g., during password reset/signup link handling)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((global as any).__SUPPRESS_WELCOME_ONCE__) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (global as any).__SUPPRESS_WELCOME_ONCE__;
            return;
          }
          const localKey = `welcome_video_seen_local_${userId}`;
          const localSeen = await AsyncStorage.getItem(localKey);
          const { data: prof } = await supabase
            .from("profiles")
            .select("welcome_video_seen_at")
            .eq("id", userId)
            .maybeSingle();
          const alreadySeen = !!(prof?.welcome_video_seen_at || localSeen);
          const videoUrl = process.env.EXPO_PUBLIC_WELCOME_VIDEO_URL || "";
          if (!alreadySeen && videoUrl) {
            // Provide a close handler that marks as seen when requested
            const handleWelcomeClose = async (markSeen: boolean) => {
              if (!markSeen) return;
              try {
                await AsyncStorage.setItem(`welcome_video_seen_local_${userId}`, "1");
                await supabase
                  .from("profiles")
                  .update({ welcome_video_seen_at: new Date().toISOString() })
                  .eq("id", userId);
              } catch {}
            };
            // Expose callbacks for the app root to render and close the modal
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (global as any).__WELCOME_ON_CLOSE__ = handleWelcomeClose;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (global as any).__SHOW_WELCOME__?.(videoUrl, userId);
          }
        } catch {}
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

  // Nothing to render here; modal is managed at the app root
}
