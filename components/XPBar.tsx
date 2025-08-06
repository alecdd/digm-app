import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";
import colors, { getLevelInfo, getNextLevelInfo } from "@/constants/colors";
import LevelUpEffect from "./LevelUpEffect";
import { Award, Zap } from "lucide-react-native";

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
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0.5)).current;
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  
  const currentLevelInfo = getLevelInfo(currentXP);
  const nextLevelInfo = getNextLevelInfo(level);
  
  const currentLevelXP = currentXP - currentLevelInfo.minXP;
  const totalLevelXP = currentLevelInfo.maxXP - currentLevelInfo.minXP;
  const progress = Math.min((currentLevelXP / totalLevelXP) * 100, 100);
  const xpToNextLevel = nextLevelInfo.minXP - currentXP;

  // Start animations for the progress bar and badge
  useEffect(() => {
    // Progress bar pulse animation
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
    
    // Badge subtle pulse animation
    const badgePulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScaleAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(badgeScaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    );
    
    // Glow animation
    const glowPulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacityAnim, {
          toValue: 0.8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: 0.5,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    );
    
    pulsate.start();
    badgePulsate.start();
    glowPulsate.start();
    
    return () => {
      pulsate.stop();
      badgePulsate.stop();
      glowPulsate.stop();
    };
  }, [pulseAnim, badgeScaleAnim, glowOpacityAnim]);

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
      <View style={styles.contentContainer}>
        {/* Level Badge */}
        <Animated.View 
          style={[
            styles.levelBadgeContainer,
            {
              transform: [{ scale: badgeScaleAnim }]
            }
          ]}
        >
          <View style={styles.badgeInner}>
            <Award color={colors.primary} size={18} style={styles.awardIcon} />
            <Text style={styles.levelText}>{level}</Text>
          </View>
          <Animated.View 
            style={[
              styles.badgeGlow,
              { opacity: glowOpacityAnim }
            ]}
          />
        </Animated.View>

        {/* XP Info */}
        <View style={styles.xpInfoContainer}>
          <View style={styles.xpTextRow}>
            <Text style={styles.xpLabel}>Current XP</Text>
            <Text style={styles.xpValue}>{currentXP}</Text>
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
          
          <View style={styles.xpDetailRow}>
            <Text style={styles.xpDetail}>{currentLevelXP}/{totalLevelXP} XP</Text>
            <View style={styles.nextLevelContainer}>
              <Zap color={colors.accent} size={14} style={styles.zapIcon} />
              <Text style={styles.nextLevelText}>{xpToNextLevel > 0 ? `${xpToNextLevel} XP to Level ${level + 1}` : 'Max Level!'}</Text>
            </View>
          </View>
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
    backgroundColor: "rgba(0, 102, 255, 0.08)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    position: "relative",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 102, 255, 0.2)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    padding: 16,
    overflow: "hidden",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelBadgeContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 16,
    position: "relative",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.5,
  },
  awardIcon: {
    marginBottom: 2,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: colors.xpColor,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  xpInfoContainer: {
    flex: 1,
  },
  xpTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
  },
  xpValue: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: colors.primary,
  },
  progressContainer: {
    height: 10,
    marginBottom: 6,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: colors.progressBackground,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.xpColor,
    borderRadius: 6,
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
    borderRadius: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  xpDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpDetail: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textSecondary,
  },
  nextLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zapIcon: {
    marginRight: 4,
  },
  nextLevelText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.accent,
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