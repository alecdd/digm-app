import { Tabs } from "expo-router";
import { Home, MessageCircle, BookOpen, User, Sparkles } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import colors from "@/constants/colors";
import DigmLogo from "@/components/DigmLogo";
import { useDigmStore } from "@/hooks/useDigmStore";
import XPBar from "@/components/XPBar";

function CustomHeader() {
  const { userProfile } = useDigmStore();
  const [showXpDetails, setShowXpDetails] = React.useState(false);
  const sparkleAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    // Sparkle animation
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    );
    
    sparkleAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
    };
  }, [sparkleAnim]);

  const toggleXpDetails = () => {
    setShowXpDetails(!showXpDetails);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <DigmLogo size={36} style={styles.logo} animated={true} />
        <View style={styles.logoTextContainer}>
          <Text style={styles.logoText}>DIGM</Text>
          <Animated.View style={[styles.sparkleContainer, { opacity: sparkleAnim }]}>
            <Sparkles color="#FFD700" size={14} />
          </Animated.View>
        </View>
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
            borderBottomColor: "rgba(0, 102, 255, 0.15)",
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  logo: {
    marginRight: 2,
  },
  logoTextContainer: {
    position: 'relative',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginLeft: 6,
    letterSpacing: 1.2,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -10,
    right: -12,
  },
  xpBarContainer: {
    width: '50%',
    marginLeft: 4,
    alignItems: 'flex-end',
  },
});