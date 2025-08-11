// components/OnboardingProgress.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";

export default function OnboardingProgress({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <View style={styles.wrapper} testID="onboarding-progress">
      <View style={styles.topRow}>
        <Text style={styles.label}>Onboarding</Text>
        <Text style={styles.label}>{pct}%</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: colors.textSecondary, fontSize: 12 },
  bar: {
    height: 8,
    width: "100%",
    borderRadius: 8,
    backgroundColor: colors.border
  },
  fill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: colors.primary
  }
});
