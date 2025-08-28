import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import colors from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDigmStore } from "@/hooks/useDigmStore";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";


export default function SettingsScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [busy, setBusy] = useState(false);
  const store = useDigmStore();
  const SUPPORT_URL = "https://digmapp.com";
  const FAQ_URL     = "https://digmapp.com";
  const ABOUT_URL   = "https://digmapp.com";


  async function openInApp(url: string) {
    // iOS = SFSafariViewController, Android = Custom Tabs
    await WebBrowser.openBrowserAsync(url, {
      dismissButtonStyle: "done",
      enableBarCollapsing: true,
      showTitle: true,
    });
  }

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: prof } = await supabase
        .from("profiles")
        .select("first_name,last_name")
        .eq("id", user.id)
        .maybeSingle();

      setFirstName(prof?.first_name ?? "");
      setLastName(prof?.last_name ?? "");
    })();
  }, []);

  const saveProfile = async () => {
    try {
      setBusy(true);

      // names in profiles
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) throw new Error("No user");

      const { error: pErr } = await supabase
        .from("profiles")
        .update({ first_name: firstName.trim(), last_name: lastName.trim() })
        .eq("id", user.id);
      if (pErr) throw pErr;

      // email/password via auth
      if (email && email !== (user.email ?? "")) {
        const { error: eErr } = await supabase.auth.updateUser({ email });
        if (eErr) throw eErr;
        Alert.alert("Verify email", "Check your inbox to confirm the new address.");
      }
      if (password) {
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) throw pwErr;
      }

      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save profile.");
    } finally {
      setBusy(false);
    }
  };

  const doSignOut = async () => {
  try {
    setBusy(true);
    await AsyncStorage.multiRemove(["pendingOnboardingAnswers"]); // clear local caches
    store.reset();                                                // clear in-memory store
    await supabase.auth.signOut();                                // end session
    router.replace("/onboarding/welcome");                        // back to Welcome
  } catch (e: any) {
    Alert.alert("Sign out failed", e?.message || "Please try again.");
  } finally {
    setBusy(false);
  }
};

const confirmSignOut = () => {
  Alert.alert("Sign out", "Are you sure you want to sign out?", [
    { text: "Cancel", style: "cancel" },
    { text: "Sign out", style: "destructive", onPress: doSignOut },
  ]);
};

  return (
    <View style={styles.screen}>
      {/* simple header with back */}
      <View style={styles.header}>
       {/* <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>Back</Text></TouchableOpacity> */}
        <View style={{ width: 48 }} />
      </View>

      <Text style={styles.section}>Profile</Text>
      <TextInput style={styles.input} placeholder="First name" value={firstName} onChangeText={setFirstName} placeholderTextColor={colors.textSecondary}/>
      <TextInput style={styles.input} placeholder="Last name"  value={lastName}  onChangeText={setLastName}  placeholderTextColor={colors.textSecondary}/>
      <TextInput style={styles.input} placeholder="Email"      value={email}     onChangeText={setEmail}     autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textSecondary}/>
      <TextInput style={styles.input} placeholder="New password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.textSecondary}/>

      <TouchableOpacity style={[styles.btn, styles.primary]} onPress={saveProfile} disabled={busy}>
        <Text style={styles.primaryText}>{busy ? "Saving..." : "Save changes"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row}><Text style={styles.rowText}>Notifications</Text></TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => openInApp(SUPPORT_URL)}>
        <Text style={styles.rowText}>Support</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={() => openInApp(FAQ_URL)}>
        <Text style={styles.rowText}>FAQ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={() => openInApp(ABOUT_URL)}>
        <Text style={styles.rowText}>About</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.ghost]} onPress={confirmSignOut} disabled={busy}>
        <Text style={styles.ghostText}>{busy ? "Signing out…" : "Sign Out"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  back: { color: colors.primary, fontWeight: "700" },
  h1: { color: colors.text, fontSize: 20, fontWeight: "800" },
  section: { color: colors.textSecondary, marginTop: 12, marginBottom: 6, fontWeight: "700" },
  input: {
    minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.cardLight
  },
  btn: { marginTop: 12, borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  primary: { backgroundColor: colors.primary },
  primaryText: { color: "#fff", fontWeight: "700" },
  ghost: { borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.text, fontWeight: "700" },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { color: colors.text },
});
