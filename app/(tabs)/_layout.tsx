import { Tabs } from "expo-router";
import { Home, MessageCircle, BookOpen, User } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import colors from "@/constants/colors";
import DigmLogo from "@/components/DigmLogo";
import { useDigmStore } from "@/hooks/useDigmStore";
import XPBar from "@/components/XPBar";

function CustomHeader() {
  const { userProfile } = useDigmStore();
  const [showXpDetails, setShowXpDetails] = React.useState(false);

  const toggleXpDetails = () => {
    setShowXpDetails(!showXpDetails);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <DigmLogo size={32} style={styles.logo} />
        <Text style={styles.logoText}>DIGM</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.xpBarContainer} 
        activeOpacity={0.9}
        onPress={toggleXpDetails}
        testID="xp-bar-toggle"
      >
        <XPBar 
          currentXP={userProfile.xp} 
          level={userProfile.level} 
          compact={true} 
        />
      </TouchableOpacity>
    </View>
  );
}

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
          headerStyle: {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.text,
          headerTitle: () => <CustomHeader />,
          headerTitleAlign: 'left',
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: {
    // Additional styling for the logo if needed
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginLeft: 8,
    letterSpacing: 1.2,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  xpBarContainer: {
    flex: 1,
    marginLeft: 4,
  },
});