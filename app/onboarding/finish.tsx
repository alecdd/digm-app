import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import colors from "@/constants/colors";

// same helpers used in index.tsx
function pickDueDateFromTimeframe(tf: string) {
  const d = new Date();
  const map: Record<string, number> = { "1 week": 7, "1 month": 30, "3 months": 90, "1 year": 365, "5 years": 365 * 5, "10 years": 365 * 10 };
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

export default function OnboardingFinish() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const userId = u.user?.id;
        if (!userId) {
          setErr("No user session.");
          return;
        }

        // Already finished?
        const { data: prof } = await supabase.from("profiles").select("onboarded, vision").eq("id", userId).maybeSingle();
        if (prof?.onboarded) {
          router.replace("/(tabs)");
          return;
        }

        // Load saved answers (from questionnaire)
        const { data: ans } = await supabase.from("onboarding_answers").select("data").eq("user_id", userId).maybeSingle();
        const answers = ans?.data ?? {};

        // Save vision + mark onboarded
        const vision = answers["vision"] ?? "";
        const { error: pErr } = await supabase
          .from("profiles")
          .update({ vision, onboarded: true, last_active: new Date().toISOString() })
          .eq("id", userId);
        if (pErr) throw pErr;

        // Create goal
        const title = answers["one_thing"] || "Your #1 Goal";
        const timeframe = (answers["timeframe"] as string) || "3 months";
        const due = pickDueDateFromTimeframe(timeframe);

        const { data: gRow, error: gErr } = await supabase
          .from("goals")
          .insert({
            user_id: userId,
            title,
            due_date: due.toISOString(),
            timeframe: mapTimeframe(timeframe),
            progress: 0,
          })
          .select("*")
          .single();
        if (gErr) throw gErr;

        // First task
        const firstTaskTitle = `First step: ${answers["ninety_day_win"] || "Start now"}`;
        const { error: tErr } = await supabase.from("tasks").insert({
          user_id: userId,
          goal_id: gRow.id,
          title: firstTaskTitle,
          status: "open",
          is_high_impact: true,
          xp_reward: 15,
        });
        if (tErr) throw tErr;

        // Pin goal
        await supabase.from("pinned_goals").upsert({ user_id: userId, goal_id: gRow.id });

        router.replace("/(tabs)");
      } catch (e: any) {
        setErr(e?.message || "Failed to finish onboarding.");
      }
    })();
  }, [router]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{err ? err : "Finishing setup…"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 12 },
  text: { color: colors.textSecondary }
});
