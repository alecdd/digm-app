import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string; type?: string; token_hash?: string }>();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const meetsPolicy = (pw: string) => pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

  const submit = async () => {
    if (!pw1 || !pw2) {
      Alert.alert("Missing info", "Enter your new password twice.");
      return;
    }
    if (pw1 !== pw2) {
      Alert.alert("Passwords don't match", "Confirm your new password.");
      return;
    }
    if (!meetsPolicy(pw1)) {
      Alert.alert("Weak password", "Use 8+ characters with letters and numbers.");
      return;
    }
    try {
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) {
        Alert.alert("Couldn't update password", error.message);
        return;
      }
      Alert.alert("Password updated", "You can now sign in with your new password.");
      router.replace("/auth/login");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // Handle various Supabase link formats: token_hash (recovery), PKCE code, or access/refresh tokens
    (async () => {
      try {
        if (params?.token_hash && params?.type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: String(params.token_hash) });
          if (error) throw error;
        } else if (params?.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(String(params.code));
          if (error) throw error;
        } else if (params?.access_token && params?.refresh_token) {
          // Non-PKCE fallback
          const { error } = await supabase.auth.setSession({
            access_token: String(params.access_token),
            refresh_token: String(params.refresh_token),
          });
          if (error) throw error;
        }
      } catch (e: any) {
        Alert.alert("Link error", e?.message || "Your reset link is invalid or expired. Request a new one from Sign in → Forgot password.");
      } finally {
        setReady(true);
      }
    })();
  }, [params?.token_hash, params?.type, params?.code, params?.access_token, params?.refresh_token]);

  if (!ready) {
    return (
      <View style={styles.screen}>
        <Text style={styles.subtitle}>Preparing reset…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create a new password</Text>
      <Text style={styles.subtitle}>This link came from your email. Set a new password below.</Text>

      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={pw1}
        onChangeText={setPw1}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={pw2}
        onChangeText={setPw2}
      />

      <TouchableOpacity style={[styles.btn, styles.primary]} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? "Updating…" : "Update password"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/auth/login")} style={[styles.btn, styles.ghost]}>
        <Text style={styles.ghostText}>Back to Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 16, justifyContent: "center" },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" as const, marginBottom: 8, textAlign: "center" },
  subtitle: { color: colors.textSecondary, textAlign: "center", marginBottom: 16 },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.cardLight,
    marginBottom: 10,
  },
  btn: { borderRadius: 10, alignItems: "center", paddingVertical: 12, marginTop: 8 },
  primary: { backgroundColor: colors.primary },
  btnText: { color: "#fff", fontWeight: "700" as const },
  ghost: { borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.text, fontWeight: "700" as const },
});


