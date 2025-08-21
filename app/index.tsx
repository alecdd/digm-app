// app/index.tsx
import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useRootNavigationState, type Href } from "expo-router";
import { supabase } from "@/lib/supabase";
import colors from "@/constants/colors";

const isAnon = (u: any) => !!u?.is_anonymous || u?.app_metadata?.provider === "anonymous";

export default function IndexGate() {
  const router = useRouter();
  const navState = useRootNavigationState();
  const didNav = useRef(false);

  useEffect(() => {
    // wait for the root navigator to be ready
    if (!navState?.key || didNav.current) return;

    let mounted = true;
    const go = (path: Href) => {
      if (!mounted || didNav.current) return;
      didNav.current = true;
      router.replace(path);
    };

    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return go("/onboarding/welcome" as Href);

        const user = data.user;
        if (isAnon(user)) return go("/onboarding/welcome" as Href);

        const { data: prof, error: pErr } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", user.id)
          .maybeSingle();

        if (pErr) return go("/onboarding/welcome" as Href);
        go((prof?.onboarded ? "/(tabs)" : "/onboarding/finish") as Href);
      } catch {
        // don't sign out on transient errors; just send to Welcome
        go("/onboarding/welcome" as Href);
      }
    })();

    // safety timeout in case anything hangs
    const t = setTimeout(() => go("/onboarding/welcome" as Href), 4000);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [navState?.key, router]); // <-- critical: depend on nav readiness

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
