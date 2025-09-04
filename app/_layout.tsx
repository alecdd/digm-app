// app/_layout.tsx
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import colors from "@/constants/colors";
import DigmHeader from "@/components/DigmHeader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { DigmProvider, useDigmStore } from "@/hooks/useDigmStore";
import { CoachProvider } from "@/hooks/useCoachStore";
import { useAuthListener } from "@/hooks/useAuthListener";
import { useSupabaseDeepLink } from "@/hooks/useSupabaseDeepLink";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AnimatedSplash from "@/components/AnimatedSplash";
import WelcomeVideoModal from "@/components/WelcomeVideoModal";

try { 
  SplashScreen.preventAutoHideAsync(); 
} catch {}

const queryClient = new QueryClient();
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  } 
});

// Component that uses the hooks after providers are set up
function AppContent() {
  const navState = useRootNavigationState();
  const hiddenRef = useRef(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const { loading, reloading } = useDigmStore();
  const [welcome, setWelcome] = useState<{ show: boolean; url: string } | null>(null);
  const [splashHardTimeout, setSplashHardTimeout] = useState(false);
  
  // Hooks moved to main component to avoid Rules of Hooks violations
  useAuthListener();
  useSupabaseDeepLink();

  useEffect(() => {
    // Provide a function for the auth listener to request showing the modal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__SHOW_WELCOME__ = (url: string) => {
      setWelcome({ show: true, url });
    };
  }, []);

  useEffect(() => {
    if (hiddenRef.current) return;
    if (navState?.key) {
      hiddenRef.current = true;
      setSplashVisible(false);
      SplashScreen.hideAsync().catch(() => {});
      return;
    }
    const t = setTimeout(() => {
      if (!hiddenRef.current) {
        hiddenRef.current = true;
        setSplashVisible(false);
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [navState?.key]);

  // Hard stop the splash after a max duration to avoid rare stuck-loading states
  useEffect(() => {
    const t = setTimeout(() => setSplashHardTimeout(true), 4500);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <AnimatedSplash visible={!splashHardTimeout && (splashVisible || loading || reloading)} />
          {welcome?.show ? (
            <WelcomeVideoModal
              visible
              sourceUrl={welcome.url}
              onClose={async (mark) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (global as any).__WELCOME_ON_CLOSE__?.(mark);
                setWelcome(null);
              }}
            />
          ) : null}
          <DigmHeader />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/finish" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <DigmProvider>
            <CoachProvider>
              <AppContent />
            </CoachProvider>
          </DigmProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
