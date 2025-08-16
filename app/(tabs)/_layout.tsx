// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Home, MessageCircle, BookOpen, User } from "lucide-react-native";
import React from "react";
import colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.inactive,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            height: 70,
          },
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Home 
                color={color} 
                size={focused ? 26 : 24} 
                fill={focused ? color : 'transparent'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: "Coach",
            tabBarIcon: ({ color, focused }) => (
              <MessageCircle 
                color={color} 
                size={focused ? 26 : 24}
                fill={focused ? color : 'transparent'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            tabBarIcon: ({ color, focused }) => (
              <BookOpen 
                color={color} 
                size={focused ? 26 : 24}
                fill={focused ? color : 'transparent'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Goals",
            tabBarIcon: ({ color, focused }) => (
              <User 
                color={color} 
                size={focused ? 26 : 24}
                fill={focused ? color : 'transparent'}
              />
            ),
          }}
        />
      </Tabs>
  );
}

