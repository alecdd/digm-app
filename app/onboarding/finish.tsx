// app/onboarding/finish.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";
import { goLogin } from "@/lib/nav";

function pickDueDateFromTimeframe(tf: string) {
  const d = new Date();
  const map: Record<string, number> = {
    "1 week": 7,
    "1 month": 30,
    "3 months": 90,
    "1 year": 365,
    "5 years": 1825,
    "10 years": 3650,
  };
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
const isAnonUser = (user: any) =>
  !!user?.is_anonymous || user?.app_metadata?.provider === "anonymous";

export default function OnboardingFinish() {
  const router = useRouter();
  const store = useDigmStore();
  const [err, setErr] = useState<string | null>(null);

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;      // ← guard
    ranRef.current = true;
    (async () => {
      try {
          // give deep-link session exchange a moment if we arrived from email
        let user = (await supabase.auth.getUser()).data.user;
            if (!user) {
              await new Promise(r => setTimeout(r, 300));
            user = (await supabase.auth.getUser()).data.user;
            if (!user) {
              goLogin(router, "no real session at /onboarding/finish", "/onboarding/finish");
              return;
            }
          }

          if (!user || isAnonUser(user)) {
            // still no real session → bounce to login and come back here
            goLogin(router, "no real session at /onboarding/finish", "/onboarding/finish");
            return;
          }

          const userId: string = user.id;
          const meta = user.user_metadata ?? {};

          // --- 2) Load answers: DB (real user) first, then local cache fallback -
          let answers: Record<string, any> = {};
          const { data: ans, error: ansErr } = await supabase
            .from("onboarding_answers")
            .select("data")
            .eq("user_id", userId)
            .maybeSingle();
          if (ansErr) throw ansErr;

          answers = ans?.data ?? {};

          if (!answers || Object.keys(answers).length === 0) {
            const cached = await AsyncStorage.getItem("pendingOnboardingAnswers");
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed && typeof parsed === "object") {
                  // Handle both old format (direct answers) and new format (with anonUserId)
                  if (parsed.answers) {
                    answers = parsed.answers;
                    const anonUserId = parsed.anonUserId;
                    
                    // Migrate data from anonymous user to real user
                    if (anonUserId && anonUserId !== userId) {
                      console.log(`[finish] Migrating data from anon user ${anonUserId} to real user ${userId}`);
                      
                      // Migrate onboarding_answers from anon user
                      try {
                        const { data: anonAnswers } = await supabase
                          .from("onboarding_answers")
                          .select("data")
                          .eq("user_id", anonUserId)
                          .maybeSingle();
                        
                        if (anonAnswers?.data) {
                          answers = { ...answers, ...anonAnswers.data };
                          // Delete the anon user's answers
                          await supabase.from("onboarding_answers").delete().eq("user_id", anonUserId);
                        }
                      } catch (e) {
                        console.warn("[finish] Failed to migrate onboarding_answers:", e);
                      }
                    }
                  } else {
                    // Old format - direct answers object
                    answers = parsed;
                  }
                }
              } catch (e) {
                console.warn("[finish] Failed to parse cached answers:", e);
              }
            }
          }

          // Persist (or re-persist) answers under the REAL user id (idempotent)
          if (answers && Object.keys(answers).length > 0) {
            const { error: upAnsErr } = await supabase
              .from("onboarding_answers")
              .upsert({ user_id: userId, data: answers }, { onConflict: "user_id" });
            if (upAnsErr) throw upAnsErr;
          }

          // Clear cache either way (we no longer need the local copy)
          await AsyncStorage.removeItem("pendingOnboardingAnswers");

          // --- 3) Upsert profile with names + vision (idempotent) ---------------
          const first_name = (answers["first_name"] ?? meta.first_name ?? "").trim();
          const last_name  = (answers["last_name"]  ?? meta.last_name  ?? "").trim();
          const vision     = (answers["vision"] ?? "").trim();

          // Ensure there is a row and mark onboarded
          const { error: profErr } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                first_name,
                last_name,
                vision,
                onboarded: true,
                last_active: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          if (profErr) throw profErr;

          // --- 4) Create first goal (if not already created) --------------------
          const title = answers["one_thing"] || "Your #1 Goal";
          const timeframeStr = (answers["timeframe"] as string) || "3 months";
          const due = pickDueDateFromTimeframe(timeframeStr);

          const { data: existingGoal } = await supabase
             .from("goals")
            .select("id")
            .eq("user_id", userId)
            .eq("title", title)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          let goalId = existingGoal?.id as string | undefined;

          if (!goalId) {
            const { data: gRow, error: gErr } = await supabase
              .from("goals")
              .insert({
                user_id: userId,
                title,
                due_date: due.toISOString(), // PostgREST accepts ISO
                timeframe: mapTimeframe(timeframeStr),
                progress: 0,
              })
              .select("id")
              .single();
            if (gErr) throw gErr;
            goalId = gRow.id;
          }

          // --- 5) Create first task (if missing) --------------------------------
          const taskTitle = `First step: ${answers["ninety_day_win"] || "Start now"}`;
          const { data: existingTask } = await supabase
            .from("tasks")
            .select("id")
            .eq("user_id", userId)
            .eq("goal_id", goalId!)
            .eq("title", taskTitle)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (!existingTask) {
            const { error: tErr } = await supabase.from("tasks").insert({
              user_id: userId,
              goal_id: goalId,
              title: taskTitle,
              status: "open",
              is_high_impact: true,
              xp_reward: 15,
            });
            if (tErr) throw tErr;
          }

          // --- 6) Pin the goal (idempotent) -------------------------------------
          const { error: pinErr } = await supabase
            .from("pinned_goals")
            .upsert(
              { user_id: userId, goal_id: goalId! },
              { onConflict: "user_id,goal_id" }
            );
          if (pinErr) throw pinErr;

          // refresh the store so Home shows the new goal/task/pin
          try {
            // if your store doesn't have reset(), the optional chaining makes this a no-op
            //store.reset?.(); 
            await store.reloadAll?.();
            // tiny yield so queries complete before we render tabs
            await new Promise(r => setTimeout(r, 20));
          } catch (e) {
            console.warn("store refresh failed", e);
          }

          router.replace("/(tabs)");
      } catch (e: any) {
        console.error("[finish] error:", e);
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
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  text: { color: colors.textSecondary },
});
