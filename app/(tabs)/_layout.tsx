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
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: "Coach",
            tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User color={color} size={24} />,
          }}
        />
      </Tabs>
  );
}