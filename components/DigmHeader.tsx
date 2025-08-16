import React from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Sparkles } from "lucide-react-native";
import colors from "@/constants/colors";
import DigmLogo from "@/components/DigmLogo";
import { useDigmStore } from "@/hooks/useDigmStore";
import XPBar from "@/components/XPBar";

export default function DigmHeader() {
  const { userProfile } = useDigmStore();
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

  return (
    <View 
      pointerEvents="box-none"
      style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <DigmLogo size={36} style={styles.logo} animated={true} />
        <View style={styles.logoTextContainer}>
          <Text style={styles.logoText}>DIGM</Text>
          <Animated.View style={[styles.sparkleContainer, { opacity: sparkleAnim }]}>
            <Sparkles color="#FFD700" size={14} />
          </Animated.View>
        </View>
      </View>
      
      <View style={styles.xpBarContainer}>
        <XPBar 
          currentXP={userProfile.xp} 
          level={userProfile.level} 
          compact={true} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
    width: '100%',
    backgroundColor: colors.background,
    borderBottomColor: "rgba(0, 102, 255, 0.15)",
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
    minHeight: 60,
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
    flex: 1,
    maxWidth: '60%',
    marginLeft: 8,
    alignItems: 'flex-end',
    position: 'relative',
    zIndex: 1000,
    overflow: 'visible',
  },
});