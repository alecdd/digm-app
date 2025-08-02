import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Animated } from "react-native";
import colors, { getLevelInfo } from "@/constants/colors";
import LevelUpEffect from "./LevelUpEffect";

interface XPBarProps {
  currentXP: number;
  level: number;
  onLevelUp?: () => void;
}

export default function XPBar({ currentXP, level, onLevelUp }: XPBarProps) {
  const previousLevel = useRef(level);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const confettiAnimated = useRef(new Animated.Value(0)).current;
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  
  const currentLevelInfo = getLevelInfo(currentXP);
  
  const currentLevelXP = currentXP - currentLevelInfo.minXP;
  const totalLevelXP = currentLevelInfo.maxXP - currentLevelInfo.minXP;
  const progress = Math.min((currentLevelXP / totalLevelXP) * 100, 100);

  useEffect(() => {
    if (level > previousLevel.current) {
      // Trigger confetti animation
      Animated.sequence([
        Animated.timing(confettiAnimated, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(confettiAnimated, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        })
      ]).start();
      
      // Show level up effect
      setShowLevelUpEffect(true);
      
      onLevelUp?.();
      previousLevel.current = level;
    }
    
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [level, progress, animatedWidth, confettiAnimated, onLevelUp]);

  return (
    <View style={styles.container} testID="xp-bar">
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Level {level}</Text>
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
    paddingVertical: 8,
    backgroundColor: "rgba(0, 102, 255, 0.15)", // Slight blue tint for XP bar background
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    position: "relative",
    zIndex: 10,
  },
  levelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.xpColor,
  },
  xpText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    height: 6,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: colors.progressBackground,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.xpColor,
    borderRadius: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  confettiText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});