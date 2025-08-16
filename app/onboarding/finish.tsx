// app/onboarding/finish.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";

function pickDueDateFromTimeframe(tf: string) {
  const d = new Date();
  const map: Record<string, number> = { "1 week":7, "1 month":30, "3 months":90, "1 year":365, "5 years":1825, "10 years":3650 };
  d.setDate(d.getDate() + (map[tf] ?? 90));
  return d;
}
function mapTimeframe(tf: string) {
  switch (tf) {
    case "10 years": return "10year";
    case "5 years":  return "5year";
    case "1 year":   return "1year";
    case "3 months": return "3month";
    case "1 month":  return "1month";
    case "1 week":   return "1week";
    default:         return "3month";
  }
}
const isAnonUser = (user: any) => !!user?.is_anonymous || user?.app_metadata?.provider === "anonymous";

export default function OnboardingFinish() {
  const router = useRouter();
  const store = useDigmStore();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (!user || isAnonUser(user)) {
          setErr("You need to be logged in to finish setup.");
          router.replace("/auth/login?redirect=/onboarding/finish");
          return;
        }

        // read locally-cached answers (set during anon onboarding)
        const raw = await AsyncStorage.getItem("pendingOnboardingAnswers");
        const answers = raw ? JSON.parse(raw) : {};

        // ensure profile row exists, get current flags
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("onboarded, vision")
          .eq("id", user.id)
          .maybeSingle();
        if (profErr) throw profErr;

        // If already onboarded, skip writes
        if (prof?.onboarded) {
          await AsyncStorage.removeItem("pendingOnboardingAnswers");
          router.replace("/(tabs)");
          return;
        }

        // write profile updates
        const vision = answers["vision"] ?? "";
        const { error: pErr } = await supabase
          .from("profiles")
          .update({ vision, onboarded: true, last_active: new Date().toISOString() })
          .eq("id", user.id);
        if (pErr) throw pErr;

        // create first goal (idempotent-ish)
        const title = answers["one_thing"] || "Your #1 Goal";
        const timeframe = (answers["timeframe"] as string) || "3 months";
        const due = pickDueDateFromTimeframe(timeframe);

        // avoid duplicates if somehow re-run
        const { data: existingGoal } = await supabase
          .from("goals")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", title)
          .maybeSingle();

        let goalId = existingGoal?.id;
        if (!goalId) {
          const { data: gRow, error: gErr } = await supabase
            .from("goals")
            .insert({
              user_id: user.id,
              title,
              due_date: due.toISOString(),
              timeframe: mapTimeframe(timeframe),
              progress: 0,
            })
            .select("id")
            .single();
          if (gErr) throw gErr;
          goalId = gRow.id;
        }

        // create first task if missing
        const taskTitle = `First step: ${answers["ninety_day_win"] || "Start now"}`;
        const { data: existingTask } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("goal_id", goalId)
          .eq("title", taskTitle)
          .maybeSingle();

        if (!existingTask) {
          const { error: tErr } = await supabase.from("tasks").insert({
            user_id: user.id,
            goal_id: goalId,
            title: taskTitle,
            status: "open",
            is_high_impact: true,
            xp_reward: 15,
          });
          if (tErr) throw tErr;
        }

        // pin goal
        await supabase.from("pinned_goals").upsert({ user_id: user.id, goal_id: goalId });

        // clean up local cache
        await AsyncStorage.removeItem("pendingOnboardingAnswers");

        // optional: refresh store so Home is fresh
        if (store?.reloadAll) await store.reloadAll();

        router.replace("/(tabs)");
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Failed to finish onboarding.");
        Alert.alert("Oops", "Could not finish onboarding. Please try again.");
      }
    })();
  }, [router, store]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{err ? err : "Finishing setup…"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 12 },
  text: { color: colors.textSecondary },
});
