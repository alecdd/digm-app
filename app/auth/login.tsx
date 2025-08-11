import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import colors from "@/constants/colors";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  // email/password local state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const goAfterLogin = () => {
    const raw = typeof redirect === "string" ? redirect : "";
    const target = (raw && raw.startsWith("/") ? raw : "/(tabs)") as Href;
    router.replace(target);
  };

  const signInWithProvider = async (provider: "google" | "apple") => {
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // For native: use your app scheme, e.g. com.digm://auth-callback
          // For web: your Supabase callback is fine.
          redirectTo: "https://<your-supabase-project>.supabase.co/auth/v1/callback",
        },
      });
      if (error) return Alert.alert("Login failed", error.message);

      // In web, Supabase completes immediately; in native, the listener will fire.
      // We still run the navigation now for web:
      goAfterLogin();
    } finally {
      setBusy(false);
    }
  };

  const signInWithPassword = async () => {
    if (!email || !password) return Alert.alert("Missing info", "Enter email and password");
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return Alert.alert("Login failed", error.message);
      goAfterLogin();
    } finally {
      setBusy(false);
    }
  };

  const signUpWithPassword = async () => {
    if (!email || !password) return Alert.alert("Missing info", "Enter email and password");
    try {
      setBusy(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return Alert.alert("Signup failed", error.message);
      Alert.alert("Check your email", "Confirm your address to finish signup.");
      // After confirm + first sign-in, listener will route
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign in to DIGM</Text>

        {/* Email / Password */}
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
          <TouchableOpacity style={styles.btnOutline} onPress={signInWithPassword} disabled={busy}>
            <Text style={styles.btnOutlineText}>Sign in</Text>
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity style={styles.btnGhost} onPress={signUpWithPassword} disabled={busy}>
            <Text style={styles.btnGhostText}>Create account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* OAuth */}
        <TouchableOpacity style={styles.btnPrimary} onPress={() => signInWithProvider("google")} disabled={busy}>
          <Text style={styles.btnPrimaryText}>Continue with Google</Text>
        </TouchableOpacity>
        {/* If/when you add Apple: */}
        {/* <TouchableOpacity style={styles.btnPrimary} onPress={() => signInWithProvider("apple")} disabled={busy}>
          <Text style={styles.btnPrimaryText}>Continue with Apple</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
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
  btnGhost: { flex: 1, borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  btnGhostText: { color: colors.textSecondary, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});
