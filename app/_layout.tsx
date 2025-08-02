import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { DigmProvider, useDigmStore } from "@/hooks/useDigmStore";
import { CoachProvider } from "@/hooks/useCoachStore";
import { View, StyleSheet } from "react-native";
import colors from "@/constants/colors";
import XPBar from "@/components/XPBar";

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
  const { userProfile } = useDigmStore();
  
  return (
    <View style={{ flex: 1 }}>
      <XPBar 
        currentXP={userProfile.xp} 
        level={userProfile.level} 
      />
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
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
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
  );
}