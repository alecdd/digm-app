// app/onboarding/CreateAccountStep.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import colors from "@/constants/colors";

export type SignupValues = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm: string;
};

type Props = {
  value: Partial<SignupValues>;
  onChange: (next: Partial<SignupValues>) => void;
  onContinueWithGoogle: () => void;       
};

function getPasswordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8 || pw.length > 64) issues.push("8–64 characters");
  if (!/[A-Z]/.test(pw)) issues.push("at least 1 uppercase letter");
  if (!/[a-z]/.test(pw)) issues.push("at least 1 lowercase letter");
  if (!/[0-9]/.test(pw)) issues.push("at least 1 number");
  if (!/[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(pw)) issues.push("at least 1 symbol");
  if (/\s/.test(pw)) issues.push("no spaces");
  return issues;
}

export default function CreateAccountStep({ 
    value, 
    onChange, 
    onContinueWithGoogle,
 }: Props) {
  const first = value.first_name ?? "";
  const last = value.last_name ?? "";
  const email = value.email ?? "";
  const password = value.password ?? "";
  const confirm = value.confirm ?? "";

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);
  const passwordsMatch = confirm.length === 0 ? true : password === confirm;

  const allFilled =
    first.trim() && last.trim() && email.trim() && password && confirm
      ? true
      : false;

  const isValid = allFilled && passwordIssues.length === 0 && passwordsMatch;

  const set = (k: keyof SignupValues, v: string) =>
    onChange({ ...value, [k]: v });

  return (
    <View>
      <Text style={styles.sub}>This lets us save your progress across devices.</Text>

      {/* Name */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="First name"
          placeholderTextColor={colors.textSecondary}
          value={first}
          onChangeText={(t) => set("first_name", t)}
          autoCapitalize="words"
        />
        <View style={{ width: 10 }} />
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Last name"
          placeholderTextColor={colors.textSecondary}
          value={last}
          onChangeText={(t) => set("last_name", t)}
          autoCapitalize="words"
        />
      </View>

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(t) => set("email", t.trim())}
      />

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Create password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={(t) => set("password", t)}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={confirm}
        onChangeText={(t) => set("confirm", t)}
      />

      {/* Live password checklist */}
      <View style={styles.rulesBox}>
        <Text style={styles.rulesTitle}>Password must include:</Text>
        {["8–64 characters","at least 1 uppercase letter","at least 1 lowercase letter","at least 1 number","at least 1 symbol","no spaces"].map((rule) => {
          const ok = !passwordIssues.includes(rule);
          return (
            <Text key={rule} style={[styles.rule, ok ? styles.ok : styles.bad]}>
              {ok ? "✓ " : "• "} {rule}
            </Text>
          );
        })}
        {!passwordsMatch && confirm.length > 0 && (
          <Text style={[styles.rule, styles.bad]}>• passwords must match</Text>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/** Google OAuth disabled for v1 — re-enable in v2 */}
      {false && (
        <TouchableOpacity style={styles.btnPrimary} onPress={onContinueWithGoogle}>
          <Text style={styles.btnPrimaryText}>Continue with Google</Text>
        </TouchableOpacity>
      )}

      {/* Helper text */}
      {!isValid && (
        <Text style={styles.help}>
          Fill all fields, meet password rules, and confirm your password.
        </Text>
      )}

      {/* Note: submission happens in your parent via finalizeOnboarding().
          This component only collects + validates and exposes `value` via onChange. */}
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
  sub: { color: colors.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 14 },

  row: { flexDirection: "row" },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.cardLight,
    marginTop: 10,
  },
  inputHalf: { flex: 1 },

  rulesBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardLight,
  },
  rulesTitle: { color: colors.text, fontWeight: "700", marginBottom: 6 },
  rule: { color: colors.textSecondary, marginTop: 2 },
  ok: { color: colors.text }, // passes => brighter
  bad: { color: colors.textSecondary },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

  btnGoogle: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnGoogleText: { color: "#fff", fontWeight: "700" },

  help: { marginTop: 10, color: colors.textSecondary, textAlign: "center" },
    btnPrimary: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});
