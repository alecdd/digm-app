// app/index.tsx
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ensureProfile, getAuthState } from "@/lib/supa-user";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureProfile({ allowAnonymous: true });

        const pending = await AsyncStorage.getItem("pendingOnboardingAnswers");
        const { isAnonymous, onboarded } = await getAuthState();
        if (!mounted) return;

        // If we have pending answers AND user is not anon, go finish first.
        if (!isAnonymous && !onboarded && pending) {
          router.replace("/onboarding/finish");
          return;
        }

        if (!onboarded) {
          router.replace("/onboarding/welcome");
        } else if (isAnonymous) {
          router.replace("/auth/login?redirect=/(tabs)");
        } else {
          router.replace("/(tabs)");
        }
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  return null;
}
