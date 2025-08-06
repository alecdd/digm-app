import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";
import colors, { getLevelInfo } from "@/constants/colors";
import LevelUpEffect from "./LevelUpEffect";
import { Award } from "lucide-react-native";

interface XPBarProps {
  currentXP: number;
  level: number;
  onLevelUp?: () => void;
}

export default function XPBar({ currentXP, level, onLevelUp }: XPBarProps) {
  const previousLevel = useRef(level);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const confettiAnimated = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  
  const currentLevelInfo = getLevelInfo(currentXP);
  
  const currentLevelXP = currentXP - currentLevelInfo.minXP;
  const totalLevelXP = currentLevelInfo.maxXP - currentLevelInfo.minXP;
  const progress = Math.min((currentLevelXP / totalLevelXP) * 100, 100);

  // Start pulse animation for the progress bar
  useEffect(() => {
    const pulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    );
    
    pulsate.start();
    
    return () => pulsate.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (level > previousLevel.current) {
      // Trigger confetti animation
      Animated.sequence([
        Animated.timing(confettiAnimated, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnimated, {
          toValue: 0,
          duration: 1000,
          delay: 2000,
          useNativeDriver: true,
        })
      ]).start();
      
      // Show level up effect
      setShowLevelUpEffect(true);
      
      onLevelUp?.();
      previousLevel.current = level;
    }
    
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [level, progress, animatedWidth, confettiAnimated, onLevelUp]);

  return (
    <View style={styles.container} testID="xp-bar">
      <View style={styles.levelContainer}>
        <View style={styles.levelBadgeContainer}>
          <Award color={colors.primary} size={16} style={styles.awardIcon} />
          <Text style={styles.levelText}>Level {level}</Text>
        </View>
        <Text style={styles.xpText}>
          {currentLevelXP} / {totalLevelXP} XP
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.progressGlow,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.5, 0.8],
                }),
                transform: [{ scale: pulseAnim }]
              }
            ]}
          />
        </View>
      </View>
      
      {/* Small level up indicator */}
      <Animated.View 
        style={[
          styles.confettiContainer,
          {
            opacity: confettiAnimated,
            transform: [{
              scale: confettiAnimated.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              })
            }]
          }
        ]}
      >
        <Text style={styles.confettiText}>🎉 Level Up! 🎉</Text>
      </Animated.View>
      
      {/* Full screen level up effect - positioned absolutely to cover entire screen */}
      {showLevelUpEffect && (
        <LevelUpEffect 
          visible={showLevelUpEffect} 
          onAnimationEnd={() => setShowLevelUpEffect(false)} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 102, 255, 0.08)", // Subtle blue tint for XP bar background
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    position: "relative",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 102, 255, 0.2)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  levelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  awardIcon: {
    marginRight: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: colors.xpColor,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  xpText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textSecondary,
  },
  progressContainer: {
    height: 8,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: colors.progressBackground,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.xpColor,
    borderRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  progressGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    backgroundColor: "transparent",
    borderRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  confettiContainer: {
    position: "absolute",
    top: -30,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  confettiText: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: colors.primary,
    textAlign: "center",
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.primary,
  },
});