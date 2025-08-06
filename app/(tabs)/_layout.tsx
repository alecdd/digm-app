import { Tabs } from "expo-router";
import { Home, MessageCircle, BookOpen, User } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors, { getLevelInfo } from "@/constants/colors";
import DigmLogo from "@/components/DigmLogo";
import { useDigmStore } from "@/hooks/useDigmStore";

function CustomHeader() {
  const { userProfile } = useDigmStore();
  const currentLevelInfo = getLevelInfo(userProfile.xp);
  const currentLevelXP = userProfile.xp - currentLevelInfo.minXP;
  const totalLevelXP = currentLevelInfo.maxXP - currentLevelInfo.minXP;
  const progress = Math.min((currentLevelXP / totalLevelXP) * 100, 100);
  
  console.log('Header XP Debug:', {
    userXP: userProfile.xp,
    userLevel: userProfile.level,
    currentLevelInfo,
    currentLevelXP,
    totalLevelXP,
    progress
  });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <DigmLogo size={28} />
        <Text style={styles.logoText}>DIGM</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelText}>Level {currentLevelInfo.level}</Text>
          <Text style={styles.xpText}>{currentLevelXP}/{totalLevelXP}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>
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
    paddingVertical: 8,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
    letterSpacing: 1,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 8,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  xpText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.progressBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});