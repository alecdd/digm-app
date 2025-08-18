// app/_layout.tsx
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import colors from "@/constants/colors";
import DigmHeader from "@/components/DigmHeader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { DigmProvider } from "@/hooks/useDigmStore";
import { CoachProvider } from "@/hooks/useCoachStore";
import { useAuthListener } from "@/hooks/useAuthListener";

try { SplashScreen.preventAutoHideAsync(); } catch {}

const queryClient = new QueryClient();
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } });
function AuthEffects() { useAuthListener(); return null; }

export default function RootLayout() {
  const navState = useRootNavigationState();
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (hiddenRef.current) return;
    if (navState?.key) {
      hiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
      return;
    }
    const t = setTimeout(() => {
      if (!hiddenRef.current) {
        hiddenRef.current = true;
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [navState?.key]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.container}>
            <StatusBar style="light" />
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
              <DigmProvider>
                <CoachProvider>
                  <DigmHeader />
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding/finish" options={{ headerShown: false }} />
                    <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                    <Stack.Screen name="journal/new-entry" options={{ headerShown: true, title: "New Journal Entry", presentation: "modal" }} />
                    <Stack.Screen name="journal/entry/[id]" options={{ headerShown: true, title: "Journal Entry" }} />
                  </Stack>
                  <AuthEffects />
                </CoachProvider>
              </DigmProvider>
            </SafeAreaView>
          </View>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
