// app/(tabs)/coach/_layout.tsx
import { Stack } from "expo-router";

export default function CoachStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main chat screen */}
      <Stack.Screen name="index" />
      {/* Add deeper coach screens here later, e.g. <Stack.Screen name="profile" /> */}
    </Stack>
  );
}
