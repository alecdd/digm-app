import { Tabs } from "expo-router";
import { Home, MessageCircle, BookOpen, User } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import colors, { getLevelInfo } from "@/constants/colors";
import DigmLogo from "@/components/DigmLogo";
import { useDigmStore } from "@/hooks/useDigmStore";

function CustomHeader() {
  const { userProfile } = useDigmStore();
  const currentLevelInfo = getLevelInfo(userProfile.xp);
  const currentLevelXP = userProfile.xp - currentLevelInfo.minXP;
  const totalLevelXP = currentLevelInfo.maxXP - currentLevelInfo.minXP;
  const progress = Math.min((currentLevelXP / totalLevelXP) * 100, 100);
  
  // Create animated progress value for smooth transitions
  const animatedProgressRef = React.useRef(new Animated.Value(0));
  const animatedProgress = animatedProgressRef.current;
  
  React.useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress, animatedProgress]);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <DigmLogo size={32} style={styles.logo} />
        <Text style={styles.logoText}>DIGM</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.levelInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{currentLevelInfo.level}</Text>
          </View>
          <Text style={styles.xpText}>{currentLevelXP}/{totalLevelXP} XP</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: animatedProgress.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
          <View style={styles.progressBarGlow} />
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
    paddingVertical: 10,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
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
  progressContainer: {
    flex: 1,
    marginLeft: 8,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelBadge: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: colors.primary,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.progressBackground,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  progressBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
});