import React, { useState } from "react";
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

  const goAfterLogin = () => router.replace(redirectPath as Href);

  const signInWithPassword = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter email and password");
      return;
    }
    try {
      setBusy(true);
      // Ensure no prior session sticks around (prevents cross-user bleed)
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("confirm")) {
          Alert.alert("Confirm your email", "Check your inbox, then sign in again.");
          return;
        }
        Alert.alert("Sign-in failed", error.message);
        return;
      }
      goAfterLogin();
    } finally {
      setBusy(false);
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
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_COACH_API_BASE || "https://digm.onrender.com"}/auth/reset`,
      });
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
        />

        <View style={styles.row}>
          <TouchableOpacity style={styles.btnPrimary} onPress={signInWithPassword} disabled={busy}>
            <Text style={styles.btnPrimaryText}>Sign in</Text>
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
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  forgot: { alignItems: "center", marginTop: 20 },
  forgotText: { color: colors.textSecondary, textDecorationLine: "underline" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  /* keep for future providers */
  tip: { marginTop: 12, color: colors.textSecondary, textAlign: "center" },
});
