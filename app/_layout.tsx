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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  }
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DigmProvider>
          <CoachProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <View style={styles.container}>
                <StatusBar style="light" />
                <RootLayoutNav />
              </View>
            </GestureHandlerRootView>
          </CoachProvider>
        </DigmProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}