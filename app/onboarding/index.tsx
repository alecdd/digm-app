import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import OnboardingProgress from "@/components/OnboardingProgress";
import { quickStart } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/supa-user";

async function isAnonymous(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const providers = (data.user?.identities ?? []).map((i: any) => i.provider);
  // anonymous means: only 'anonymous' provider, or no providers at all
  return providers.length === 0 || (providers.length === 1 && providers[0] === "anonymous");
}


type Answers = Record<string, any>;

export default function OnboardingScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const total = quickStart.length;
  const step = stepIdx + 1;
  const q = useMemo(() => quickStart[stepIdx], [stepIdx]);

  const [answers, setAnswers] = useState<Answers>({});
  const [draft, setDraft] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await ensureProfile();
        setUserId(u.id);
        const { data } = await supabase
          .from("onboarding_answers")
          .select("data")
          .eq("user_id", u.id)
          .maybeSingle();
        if (data?.data) setAnswers(data.data);
      } catch (e: any) {
        console.error("Onboarding init failed:", e?.message || e);
      }
    })();
  }, []);

  useEffect(() => {
    const existing = answers[quickStart[stepIdx]?.key];
    setDraft(existing == null ? "" : String(existing));
  }, [stepIdx, answers]);

  const saveCurrentAnswer = useCallback(async (key: string) => {
    if (!userId) return false;
    let value: any = draft;
    if (q.type === "number") {
      const num = Number(String(draft).replace(/[^\d]/g, ""));
      value = Number.isFinite(num) ? num : 0;
    }
    const newData = { ...answers, [key]: value };
    setSaving(true);
    const { error } = await supabase
      .from("onboarding_answers")
      .upsert({ user_id: userId, data: newData }, { onConflict: "user_id" });
    if (error) {
      console.error("saveAnswer error:", error);
      Alert.alert("Save failed", "Could not save your answer. Please try again.");
      setSaving(false);
      return false;
    }
    setAnswers(newData);
    setSaving(false);
    return true;
  }, [userId, draft, answers, q.type]);

const onNext = useCallback(async () => {
  if (q.required && (draft == null || String(draft).trim() === "")) {
    Alert.alert("One more thing", "Please answer before continuing.");
    return;
  }

  const ok = await saveCurrentAnswer(q.key);
  if (!ok) return;

  if (stepIdx < total - 1) {
    setStepIdx(stepIdx + 1);
  } else {
    await finalizeOnboarding();
  }
}, [q, draft, stepIdx, total, saveCurrentAnswer]);

  const onBack = useCallback(async () => {
    if (stepIdx === 0) return;
    await saveCurrentAnswer(q.key);
    setStepIdx(stepIdx - 1);
  }, [stepIdx, q.key, saveCurrentAnswer]);

  const finalizeOnboarding = useCallback(async () => {
    if (!userId) return;
    try {
        setSaving(true);

        // Save vision + mark onboarded
        const vision = answers["vision"] ?? "";
        const { error: pErr } = await supabase
        .from("profiles")
        .update({ vision, onboarded: true, last_active: new Date().toISOString() })
        .eq("id", userId);
        if (pErr) throw pErr;

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

      // Pin new goal
      const { error: pinErr } = await supabase
        .from("pinned_goals")
        .upsert({ user_id: userId, goal_id: gRow.id });
      if (pinErr) console.error("Pin goal failed:", pinErr);

       setSaving(false);
    router.replace("/(tabs)"); // <- stay in app, DO NOT go to /auth/login
  } catch (e: any) {
    console.error("finalizeOnboarding error:", e?.message || e);
    setSaving(false);
    Alert.alert("Oops", "Could not finish onboarding. Please try again.");
  }
}, [userId, answers, router]);

  const renderInput = () => {
    if (q.type === "text") {
      return (
        <TextInput
          style={styles.input}
          placeholder={q.placeholder || "Type your answer"}
          placeholderTextColor={colors.textSecondary}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
      );
    }
    if (q.type === "number") {
      return (
        <TextInput
          style={styles.input}
          placeholder={q.placeholder || "0"}
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          value={draft}
          onChangeText={setDraft}
        />
      );
    }
    if (q.type === "single" && q.options) {
      const current = answers[q.key];
      const pending = draft || current || "";
      return (
        <View style={styles.optionsWrap}>
          {q.options.map((opt) => {
            const selected = pending === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setDraft(opt)}
                style={[styles.optionBtn, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    return (
      <TextInput
        style={styles.input}
        placeholder={q.placeholder || "YYYY-MM-DD"}
        placeholderTextColor={colors.textSecondary}
        value={draft}
        onChangeText={setDraft}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.progressWrap}>
        <OnboardingProgress step={step} total={total} />
      </View>

      <ScrollView
        contentContainerStyle={styles.centerWrap}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>{q.title}</Text>
          {!!q.subtitle && <Text style={styles.subtitle}>{q.subtitle}</Text>}

          <View style={{ marginTop: 16 }}>{renderInput()}</View>

          {saving && (
            <View style={styles.savingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.savingText}>Saving…</Text>
            </View>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={onBack}
              disabled={stepIdx === 0 || saving}
              style={[styles.navBtn, (stepIdx === 0 || saving) && styles.navBtnDisabled]}
            >
              <Text style={styles.navText}>Back</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={onNext}
              disabled={saving}
              style={[styles.navBtnPrimary, saving && styles.navBtnDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.navTextPrimary}>{stepIdx === total - 1 ? "Finish" : "Next"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function pickDueDateFromTimeframe(tf: string) {
  const d = new Date();
  const map: Record<string, number> = {
    "1 week": 7, "1 month": 30, "3 months": 90, "1 year": 365, "5 years": 365 * 5, "10 years": 365 * 10,
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  progressWrap: { paddingHorizontal: 16, paddingTop: 12 },
  centerWrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: { marginTop: 6, color: colors.textSecondary, textAlign: "center" },
  input: {
    minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.cardLight,
  },
  optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  optionBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.cardLight,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
  optionText: { color: colors.text }, optionTextSelected: { color: colors.primary, fontWeight: "700" },
  navRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  navBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  navBtnDisabled: { opacity: 0.5 },
  navBtnPrimary: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.primary },
  navText: { color: colors.text }, navTextPrimary: { color: "#fff", fontWeight: "700" },
  savingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  savingText: { color: colors.textSecondary, fontSize: 12 },
});
