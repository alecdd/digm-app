import React, { useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { redirect: qRedirect } = useLocalSearchParams<{ redirect?: string }>();
  const rawRedirect = typeof qRedirect === "string" ? qRedirect : "/(tabs)";
  const redirectPath = rawRedirect.startsWith("/") ? rawRedirect : `/${rawRedirect}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  const goAfterLogin = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(redirectPath as Href);
  };

  const signInWithPassword = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter email and password");
      return;
    }
    try {
      setBusy(true);
      setErrorMsg(null);
      
      // Clear any existing session to avoid conflicts
      await supabase.auth.signOut({ scope: 'global' });
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("confirm")) {
          Alert.alert("Confirm your email", "Check your inbox, then sign in again.");
          return;
        }
        setErrorMsg(error.message);
        return;
      }
      // Wait for session/user to be available, then navigate
      const start = Date.now();
      while (Date.now() - start < 4000) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          goAfterLogin();
          break;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    } finally {
      // Re-enable button after a short grace period in case navigation didn’t occur
      setTimeout(() => {
        if (!redirectedRef.current) setBusy(false);
      }, 300);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setBusy(true);
      const redirectTo =
        Platform.OS === "web"
          ? `${window.location.origin}${redirectPath}`
          : Linking.createURL(redirectPath.replace(/^\//, ""));

      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "google", 
        options: { redirectTo },
      });
      if (error) {
        Alert.alert("Login failed", error.message);
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  const onForgotPassword = async () => {
    if (!email) {
      Alert.alert("Enter your email", "We’ll send a reset link to the address you enter above.");
      return;
    }
    try {
      setBusy(true);
      // Suppress welcome video once during recovery flow
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).__SUPPRESS_WELCOME_ONCE__ = true;

      // Use backend deep-link redirector so emails contain an https URL that 302s into the app scheme
      const backendBase = process.env.EXPO_PUBLIC_COACH_API_BASE || process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "";
      const redirectTo = Platform.OS === "web"
        ? `${window.location.origin}/auth/reset`
        : backendBase ? `${backendBase.replace(/\/$/, "")}/auth/reset` : Linking.createURL("auth/reset");

      await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      Alert.alert("Email sent", "Please check your inbox (and spam) to reset your password.");
    } catch (e: any) {
      Alert.alert("Couldn’t send reset email", e?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        accessibilityLabel="Back"
        onPress={() => router.replace("/onboarding/welcome" as Href)}
        style={styles.backBtn}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>Sign in to DIGM</Text>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={signInWithPassword}
        />

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btnPrimary, busy && styles.btnDisabled]} onPress={signInWithPassword} disabled={busy}>
            <Text style={styles.btnPrimaryText}>{busy ? "Signing in..." : "Sign in"}</Text>
          </TouchableOpacity>
        </View>

        {/*
        <View style={styles.divider} />
        <TouchableOpacity style={styles.btnPrimary} onPress={signInWithGoogle} disabled={busy}>
          <Text style={styles.btnPrimaryText}>Continue with Google</Text>
        </TouchableOpacity>
        */}

        <Text style={styles.tip}>
          {redirectPath === "/onboarding/finish"
            ? "After signing in, we’ll finish setting up your account."
            : "After signing in, you’ll go to your home screen."}
        </Text>
      </View>
      <TouchableOpacity style={styles.forgot} onPress={onForgotPassword} disabled={busy}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
  backBtn: {
    position: "absolute",
    top: 12,         // nudge down if your header is taller
    left: 12,
    padding: 6,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  card: {
    margin: 16, padding: 20, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 16 },
  input: {
    minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.cardLight, marginTop: 10,
  },
  row: { flexDirection: "row", marginTop: 12 },
  btnOutline: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  btnOutlineText: { color: colors.text, fontWeight: "700" },
  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center", flex: 1 },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  errorText: { color: colors.error, marginTop: 8, textAlign: "center" },
  forgot: { alignItems: "center", marginTop: 20 },
  forgotText: { color: colors.textSecondary, textDecorationLine: "underline" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  /* keep for future providers */
  tip: { marginTop: 12, color: colors.textSecondary, textAlign: "center" },
});
