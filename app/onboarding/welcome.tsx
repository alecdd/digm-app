import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import OnboardingProgress from "@/components/OnboardingProgress";

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* keep progress visible, but not glued to top */}
      <View style={styles.progressWrap}>
        <OnboardingProgress step={0} total={7} />
      </View>

      {/* Center the card; Scroll if content ever overflows on small screens */}
      <ScrollView
        contentContainerStyle={styles.centerWrap}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* <Image source={require("@/assets/digm-logo.png")} style={styles.logo} /> */}
          <Text style={styles.title}>Welcome to DIGM</Text>
          <Text style={styles.subtitle}>
            A coach-in-your-pocket to help you clarify your vision, set focused goals,
            and finish what matters.
          </Text>

          <TouchableOpacity
            style={styles.primary}
            onPress={() => router.replace("/onboarding")}
          >
            <Text style={styles.primaryText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outline}
            onPress={() =>
              router.replace({ pathname: "/auth/login", params: { redirect: "/(tabs)" } })
            }
          >
            <Text style={styles.outlineText}>I Already Have an Account</Text>
          </TouchableOpacity>
          {/* Optional “Skip for now”
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.secondaryText}>Skip for now</Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
    </View>
  );
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
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logo: { width: 72, height: 72, borderRadius: 16, marginBottom: 12, alignSelf: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 8 },
  subtitle: { color: colors.textSecondary, textAlign: "center", marginBottom: 16 },
  points: { gap: 6, marginBottom: 20 },
  point: { color: colors.text, textAlign: "center" },

  primary: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },

  outline: {
    marginTop: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  outlineText: { color: colors.text, fontWeight: "700" },
});
