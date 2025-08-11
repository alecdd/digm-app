import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { DigmProvider } from "@/hooks/useDigmStore";
import { CoachProvider } from "@/hooks/useCoachStore";
import { View, StyleSheet, SafeAreaView } from "react-native";
import colors from "@/constants/colors";
import DigmHeader from "@/components/DigmHeader";
import { supabase } from '@/lib/supabase';
import { ensureProfile } from "@/lib/supa-user";
import { useAuthListener } from "@/hooks/useAuthListener";
import { useRouter } from "expo-router"; // ✅ add at top if not imported


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  }
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthEffects() {
  // ✅ This runs only when inside <DigmProvider>
  useAuthListener();
  return null;
}

function RootLayoutNav() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, overflow: 'visible' }}>
      <DigmHeader />
      <Stack 
        screenOptions={{ 
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="journal/new-entry" options={{ 
          headerShown: true,
          title: "New Journal Entry",
          presentation: "modal"
        }} />
        <Stack.Screen name="journal/entry/[id]" options={{ 
          headerShown: true,
          title: "Journal Entry"
        }} />
      </Stack>
    </SafeAreaView>
  );
}


export default function RootLayout() {
  const router = useRouter();

  //useAuthListener(); // ✅ call here so it runs when layout mounts

  useEffect(() => {
    console.log('SB URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);

    (async () => {
      const u = await ensureProfile();
      console.log('AUTH USER:', u?.id);
        const { data: session } = await supabase.auth.getSession();

        if (!session.session) {
          router.replace("/auth/login?redirect=/onboarding/welcome");
          return;
        }

        const { data: p } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", session.session.user.id)
          .maybeSingle();

        if (p && p.onboarded === false) {
          router.replace("/onboarding/welcome");
          return;
        }

      SplashScreen.hideAsync();
    })();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DigmProvider>
          <CoachProvider>
              <Stack screenOptions={{ headerShown: false }} />
              {/* 🔐 Now we are inside the provider, safe to subscribe */}
              <AuthEffects />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                  <StatusBar style="light" />
                  <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                    <DigmHeader />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                        headerTitleStyle: { fontWeight: "bold" },
                      }}
                    >
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="journal/new-entry"
                        options={{ headerShown: true, title: "New Journal Entry", presentation: "modal" }}
                      />
                      <Stack.Screen
                        name="journal/entry/[id]"
                        options={{ headerShown: true, title: "Journal Entry" }}
                      />
                    </Stack>
                  </SafeAreaView>
                </View>
              </GestureHandlerRootView>
        </CoachProvider>
      </DigmProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
}