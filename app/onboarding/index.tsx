// app/onboarding/index.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from "react-native";
import { Href, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/constants/colors";
import OnboardingProgress from "@/components/OnboardingProgress";
import { quickStart } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/supa-user";
import CreateAccountStep, { SignupValues } from "./CreateAccountStep";
import { BackHandler, Keyboard } from "react-native";

type Answers = Record<string, any>;

function isSignupValid(s: Partial<SignupValues>) {
  const emailOk = !!s.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email);
  const pw = s.password ?? "";
  const confirm = s.confirm ?? "";
  const pwOk =
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw) &&
    pw.length >= 8 &&
    pw.length <= 64 &&
    !/\s/.test(pw);
  return Boolean((s.first_name ?? "").trim() && (s.last_name ?? "").trim() && emailOk && pwOk && confirm && pw === confirm);
}

const isAnon = (u: any) => !!u?.is_anonymous || u?.app_metadata?.provider === "anonymous";


export default function OnboardingScreen() {
  const router = useRouter();

  const [userId, setUserId]   = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const totalQs = quickStart.length;
  const isAccountStep = stepIdx >= totalQs;
  const totalSteps            = totalQs + 1;
  const step                  = stepIdx + 1;

  const q = useMemo(() => quickStart[stepIdx], [stepIdx]);

  const [answers, setAnswers] = useState<Answers>({});
  const [draft, setDraft]     = useState<string>("");
  const [saving, setSaving]   = useState(false);
  const [signup, setSignup]   = useState<Partial<SignupValues>>({});
  const [notice, setNotice] = useState("");
  const stepRef = React.useRef(stepIdx);
  const draftRef = React.useRef(draft);
  useEffect(() => { stepRef.current = stepIdx; }, [stepIdx]);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  // ensure session (anon allowed) + load any saved answers
  useEffect(() => {
    (async () => {
      try {
        const { user } = await ensureProfile({ allowAnonymous: true });
        setUserId(user.id);
        const { data } = await supabase.from("onboarding_answers").select("data").eq("user_id", user.id).maybeSingle();
        if (data?.data) setAnswers(data.data);
      } catch (e: any) {
        console.error("Onboarding init failed:", e?.message || e);
      }
    })();
  }, []);


    useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (isAccountStep) { setStepIdx(totalQs - 1); return true; }
        if (stepIdx === 0) { router.replace("/onboarding/welcome" as Href); return true; }
        setStepIdx((i) => Math.max(0, i - 1));
        return true;
    });
    return () => sub.remove();
    }, [isAccountStep, stepIdx, totalQs, router]);

  // keep draft in sync per question (skip on account step)
  useEffect(() => {
    if (isAccountStep) { setDraft(""); return; }
    const existing = answers[quickStart[stepIdx]?.key];
    setDraft(existing == null ? "" : String(existing));
  }, [stepIdx, answers, isAccountStep]);

  // save single answer; never block progression
  const saveCurrentAnswer = useCallback(async (key: string) => {
    let value: any = draft;
    const currentQ = quickStart[stepIdx];
    if (currentQ?.type === "number") {
      const num = Number(String(draft).replace(/[^\d]/g, ""));
      value = Number.isFinite(num) ? num : 0;
    }
    const newData = { ...answers, [key]: value };
    setAnswers(newData);

    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user || isAnon(u.user)) return true; // skip DB write for anon
      await supabase.from("onboarding_answers").upsert({ user_id: u.user.id, data: newData }, { onConflict: "user_id" });
      return true;
    } catch (e) {
      console.log("[onboarding] save skipped", e);
      return true;
    }
  }, [answers, draft, stepIdx]);

  // resend verification helper
  const resendSignupEmail = useCallback(async (email: string) => {
    await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo:
          Platform.OS === "web"
            ? `${window.location.origin}/onboarding/finish`
            : Linking.createURL("onboarding/finish"),
      },
    });
    Alert.alert("Email sent", "Check your inbox again.");
  }, []);

const finalizeOnboarding = useCallback(async () => {
  const failSafe = setTimeout(() => setSaving(false), 12000);
  try {
    setSaving(true);

    // Store answers + anon user ID for migration after email confirmation
    const { data: currentUser } = await supabase.auth.getUser();
    const anonUserId = currentUser?.user?.id;
    
    await AsyncStorage.setItem("pendingOnboardingAnswers", JSON.stringify({
      answers,
      anonUserId: isAnon(currentUser?.user) ? anonUserId : null
    }));

    // If we already have a real session, jump to finish
    {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user && !isAnon(u.user)) {
        router.replace("/onboarding/finish");
        return;
      }
      if (u?.user && isAnon(u.user)) {
        await supabase.auth.signOut();
      }
      // give the client a beat to clear the anon session before signUp
      await supabase.auth.getSession();
      await new Promise((r) => setTimeout(r, 50));
    }

    const first_name = (signup.first_name ?? "").trim();
    const last_name  = (signup.last_name  ?? "").trim();
    const email      = (signup.email      ?? "").trim();
    const password   = signup.password ?? "";
    const confirm    = signup.confirm  ?? "";

    if (!isSignupValid({ first_name, last_name, email, password, confirm })) {
      Alert.alert("Missing or invalid info", "Check name, email, and password requirements.");
      return;
    }

    const emailRedirectTo = `${process.env.EXPO_PUBLIC_COACH_API_BASE || "https://digm.onrender.com"}/auth/confirm?dest=auth/reset&redirect=/onboarding/finish`;

    console.log("Mobile Redirect [signup] redirectTo:", emailRedirectTo);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name },
        emailRedirectTo,
      },
    });

    console.log("[signup] result:", {
      error: error?.message,
      hasSession: !!data?.session,
      userId: data?.user?.id,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already")) {
        Alert.alert("Email already registered", "Please sign in.");
        setNotice("");
        router.replace({ pathname: "/auth/login", params: { redirect: "/onboarding/finish" } });
        return;
      }
      Alert.alert("Signup failed", error.message);
      return;
    }

    // If email confirmations are OFF -> you have a session now
    if (data?.session) {
      router.replace("/onboarding/finish");
      return;
    }

    // Email confirmation required:
    // Proactively trigger a resend to make sure an email definitely goes out.
    try {
      await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });
      console.log("[signup] resent verification email");
    } catch (e: any) {
      console.warn("[signup] resend failed:", e?.message || e);
    }

    setNotice("We sent a verification email. Please check your inbox (and spam), then sign in.");
    Alert.alert(
      "Check your inbox",
      "Confirm your email, then sign in to finish setup.",
      [
        { text: "OK" },
        {
          text: "Go to login",
          onPress: () =>
            router.replace({ pathname: "/auth/login", params: { redirect: "/onboarding/finish" } }),
        },
      ]
    );
    return;
  } catch (e: any) {
    console.error("finalizeOnboarding", e);
    Alert.alert("Oops", e?.message ?? "Could not finish onboarding.");
  } finally {
    clearTimeout(failSafe);
    setSaving(false);
  }
}, [answers, signup, router]);

const onNext = useCallback(() => {
  Keyboard.dismiss();

  const idx = stepRef.current;
  const total = totalQs;

  if (idx >= total) {
    // account step
    finalizeOnboarding();
    return;
  }

  const currentQ = quickStart[idx];
  const val = String(draftRef.current ?? "").trim();
  if (currentQ?.required && !val) {
    Alert.alert("One more thing", "Please answer before continuing.");
    return;
  }

  // do not await: avoid any iOS/network stalls blocking the tap
  try { saveCurrentAnswer(currentQ.key); } catch {}

  setStepIdx(i => {
    const next = Math.min(i + 1, totalQs);
    console.log("advance iOS", { from: i, to: next });
    return next;
  });
}, [finalizeOnboarding, saveCurrentAnswer, totalQs]);


  const onBack = useCallback(async () => {
    const idx = stepRef.current;

    if (idx >= totalQs) { setStepIdx(totalQs - 1); return; }
    if (idx === 0) { router.replace("/onboarding/welcome" as Href); return; }

    try { await saveCurrentAnswer(quickStart[idx].key); } catch {}
    setStepIdx((i) => Math.max(0, i - 1));
  }, [router, saveCurrentAnswer, totalQs]);

  // Google OAuth disabled for v1
  const onContinueWithGoogle = useCallback(async () => {
    Alert.alert("Unavailable", "Google sign-in is coming soon.");
  }, []);

  const renderInput = () => {
    if (isAccountStep) {
      return (
        <CreateAccountStep
          value={signup}
          onChange={setSignup}
          onContinueWithGoogle={onContinueWithGoogle}
        />
      );
    }

    if (q?.type === "text") {
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
    if (q?.type === "number") {
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
    if (q?.type === "single" && q.options) {
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
        placeholder={q?.placeholder || "YYYY-MM-DD"}
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
        <OnboardingProgress step={step} total={totalSteps} />
      </View>

      <ScrollView contentContainerStyle={styles.centerWrap} keyboardShouldPersistTaps="handled">
        <View style={styles.card} pointerEvents="box-none">
          <Text style={styles.title}>
            {isAccountStep ? "Create your DIGM account" : q.title}
          </Text>
          {!!(!isAccountStep && q.subtitle) && <Text style={styles.subtitle}>{q.subtitle}</Text>}

          <View style={{ marginTop: 16 }}>{renderInput()}</View>

          {notice ? (
            <View
                style={[
                styles.noticeBox,
                { borderColor: colors.primary, backgroundColor: colors.primary + "22" }
                ]}
            >
                <Text style={[styles.noticeText, { color: colors.primary }]}>
                {notice}
                </Text>

                {/* Optional: inline “Resend email” link */}
                {signup?.email ? (
                <Text
                    style={[styles.noticeLink, { color: colors.primary }]}
                    onPress={() => resendSignupEmail(signup.email!)}
                >
                    Resend verification email
                </Text>
                ) : null}
            </View>
            ) : null}

          {saving && (
            <View style={styles.savingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.savingText}>Saving…</Text>
            </View>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top:10, bottom:10, left:10, right:10 }}  // ✅ bigger tap target
              disabled={saving}
              style={[styles.navBtn, saving && styles.navBtnDisabled]}
            >
                <Text style={styles.navText}>Back</Text>
            </TouchableOpacity>


            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={onNext}
              hitSlop={{ top:10, bottom:10, left:10, right:10 }}  // ✅
              disabled={saving}
              style={[styles.navBtnPrimary, saving && styles.navBtnDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.navTextPrimary}>
                  {isAccountStep ? "Create account" : stepIdx === totalQs - 1 ? "Continue" : "Next"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  progressWrap: { paddingHorizontal: 16, paddingTop: 12 },
  centerWrap: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 24 },
  card: {
    width: "100%", maxWidth: 520, padding: 16, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 8,
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
  noticeBox: {
  marginTop: 10,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 10,
  borderWidth: 1,
},
noticeText: {
  textAlign: "center",
  fontWeight: "600",
},
noticeLink: {
  marginTop: 6,
  textAlign: "center",
  textDecorationLine: "underline",
},
});
