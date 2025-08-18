// app/index.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, type Href } from "expo-router";
import { supabase } from "@/lib/supabase";
import colors from "@/constants/colors";

const isAnon = (u: any) => !!u?.is_anonymous || u?.app_metadata?.provider === "anonymous";

export default function IndexGate() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const goWelcome = async () => {
        try { await supabase.auth.signOut(); } catch {}
        if (!mounted) return;
        router.replace("/onboarding/welcome" as Href);
      };

      try {
        // Ask for the current user/session
        const { data, error } = await supabase.auth.getUser();

        // Any auth error or no user → reset and go welcome
        if (error || !data?.user) return void goWelcome();

        const user = data.user;

        // Anonymous users → welcome
        if (isAnon(user)) return void router.replace("/onboarding/welcome" as Href);

        // Real user → check onboarded flag
        const { data: prof, error: pErr } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", user.id)
          .maybeSingle();

        if (pErr) return void goWelcome();

        router.replace((prof?.onboarded ? "/(tabs)" : "/onboarding/welcome") as Href);
      } catch {
        // Network or unexpected → reset to welcome
        await supabase.auth.signOut().catch(() => {});
        router.replace("/onboarding/welcome" as Href);
      }
    })();

    return () => { mounted = false; };
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
