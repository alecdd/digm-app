import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, Text, View, Animated, Easing, Dimensions, TouchableOpacity, Platform } from "react-native";
import colors, { getLevelInfo, getNextLevelInfo } from "@/constants/colors";
import LevelUpEffect from "./LevelUpEffect";
import { Award, Zap, TrendingUp, ChevronUp, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface XPBarProps {
  currentXP: number;
  level: number;
  onLevelUp?: () => void;
  compact?: boolean;
  userId?: string;
}

export default function XPBar({ currentXP, level, onLevelUp, compact = false, userId }: XPBarProps) {
  const previousLevel = useRef(level);
  const lastSeenLevelRef = useRef<number | null>(null);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const confettiAnimated = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0.5)).current;
  const shineAnim = useRef(new Animated.Value(-100)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const currentLevelInfo = getLevelInfo(currentXP);
  const nextLevelInfo = getNextLevelInfo(level);
  
  const currentLevelXP = currentXP - currentLevelInfo.minXP;
  const totalLevelXP = currentLevelInfo.maxXP - currentLevelInfo.minXP;
  const progress = Math.min((currentLevelXP / totalLevelXP) * 100, 100);
  const xpToNextLevel = nextLevelInfo.minXP - currentXP;
  const progressPercentage = Math.floor(progress);

  // Load last seen level per-user to prevent replaying effect after reloads
  useEffect(() => {
    (async () => {
      try {
        if (!userId) { lastSeenLevelRef.current = level; previousLevel.current = level; return; }
        const key = `last_level_seen_${userId}`;
        const raw = await AsyncStorage.getItem(key);
        const seen = raw ? Number(raw) : level;
        lastSeenLevelRef.current = seen;
        previousLevel.current = seen; // align baseline with last seen
        // If current level already equals seen, ensure no effect is shown
        if (level <= seen) setShowLevelUpEffect(false);
      } catch {}
    })();
  }, [userId]);

  // Start animations for the progress bar and badge
  useEffect(() => {
    // Progress bar pulse animation
    const pulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
    
    // Shine animation (moving highlight across the progress bar)
    const shineAnimation = Animated.loop(
      Animated.timing(shineAnim, {
        toValue: Dimensions.get('window').width,
        duration: 2000,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    );
    
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
    
    pulsate.start();
    badgePulsate.start();
    glowPulsate.start();
    shineAnimation.start();
    sparkleAnimation.start();
    
    return () => {
      pulsate.stop();
      badgePulsate.stop();
      glowPulsate.stop();
      shineAnimation.stop();
      sparkleAnimation.stop();
    };
  }, [pulseAnim, badgeScaleAnim, glowOpacityAnim, shineAnim, sparkleAnim]);

  useEffect(() => {
    const baseline = lastSeenLevelRef.current ?? previousLevel.current;
    if (level > baseline) {
      console.log(`🎖️ LEVEL UP DETECTED! From level ${previousLevel.current} to ${level}`);
      
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

      // Show level up effect with priority
      console.log('🎖️ Showing level up effect with priority');
      setShowLevelUpEffect(true);
      
      onLevelUp?.();
      previousLevel.current = level;
      // persist last seen level per-user to avoid replay after reloads
      (async () => {
        try {
          if (userId) {
            await AsyncStorage.setItem(`last_level_seen_${userId}`, String(level));
          }
        } catch {}
      })();
    }
    
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [level, progress, animatedWidth, confettiAnimated, onLevelUp, userId]);

  const toggleExpanded = () => {
    console.log('XP Bar toggle clicked, current expanded:', expanded);
    console.log('Setting expanded to:', !expanded);
    console.log('Current level:', level, 'Current XP:', currentXP);
    setExpanded(!expanded);
  };
  
  // Handle clicks outside the expanded details to close it
  useEffect(() => {
    if (expanded && compact) {
      if (Platform.OS === 'web') {
        const handleOutsideClick = (event: any) => {
          // Check if the click is outside the XP bar component
          const target = event.target;
          const xpBarElement = document.querySelector('[data-testid="xp-bar"]');
          if (xpBarElement && !xpBarElement.contains(target)) {
            setExpanded(false);
          }
        };
        
        // Add a timeout to prevent immediate closing when opening
        const timer = setTimeout(() => {
          document.addEventListener('click', handleOutsideClick);
        }, 100);
        
        return () => {
          clearTimeout(timer);
          document.removeEventListener('click', handleOutsideClick);
        };
      } else {
        // For mobile, we'll use a timeout to auto-close the expanded details after 5 seconds
        const timer = setTimeout(() => {
          setExpanded(false);
        }, 5000);
        
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [expanded, compact]);

  // Determine if we should use LinearGradient (not available on web)
  const useGradient = Platform.OS !== 'web';

  const renderProgressFill = () => {
    const progressStyle = [
      styles.progressFill,
      {
        width: animatedWidth.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
          extrapolate: 'clamp',
        })
      }
    ];

    if (useGradient) {
      return (
        <Animated.View style={progressStyle}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          >
            {/* Shine effect */}
            <Animated.View 
              style={[
                styles.shine,
                {
                  transform: [{ translateX: shineAnim }]
                }
              ]}
            />
          </LinearGradient>
        </Animated.View>
      );
    } else {
      return (
        <Animated.View style={progressStyle}>
          {/* Shine effect */}
          <Animated.View 
            style={[
              styles.shine,
              {
                transform: [{ translateX: shineAnim }]
              }
            ]}
          />
        </Animated.View>
      );
    }
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]} testID="xp-bar" {...(Platform.OS === 'web' ? { 'data-testid': 'xp-bar' } : {})}>
      <View style={styles.contentContainer}>
        {/* Level Badge */}
        <TouchableOpacity 
          onPress={toggleExpanded} 
          activeOpacity={0.6} 
          testID="level-badge-button"
          style={styles.touchableArea}
        >
          <Animated.View 
            style={[
              styles.levelBadgeContainer,
              compact && styles.compactBadge,
              {
                transform: [{ scale: badgeScaleAnim }]
              }
            ]}
          >
            <View style={styles.badgeInner}>
              <Award color={colors.primary} size={compact ? 16 : 18} style={styles.awardIcon} />
              <Text style={[styles.levelText, compact && styles.compactLevelText]}>{level}</Text>
            </View>
            <Animated.View 
              style={[
                styles.badgeGlow,
                { opacity: glowOpacityAnim }
              ]}
            />
            <Animated.View 
              style={[
                styles.badgeSparkle,
                { opacity: sparkleAnim }
              ]}
            >
              <Sparkles color="#FFD700" size={compact ? 14 : 16} />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>

        {/* XP Info */}
        <View style={styles.xpInfoContainer}>
          {!compact && (
            <View style={styles.xpTextRow}>
              <View style={styles.xpLabelContainer}>
                <TrendingUp color={colors.primary} size={14} style={styles.trendingIcon} />
                <Text style={styles.xpLabel}>Experience</Text>
              </View>
              <Text style={styles.xpValue}>{currentXP} XP</Text>
            </View>
          )}
          
          <View style={[styles.progressContainer, compact && styles.compactProgressContainer]}>
            <View style={styles.progressBackground}>
              {renderProgressFill()}
              
              <Animated.View 
                style={[
                  styles.progressGlow,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.05],
                      outputRange: [0.5, 0.8],
                    }),
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              />
              
              {/* Progress percentage indicator */}
              {progressPercentage > 15 && !compact && (
                <View style={styles.percentageContainer}>
                  <Text style={styles.percentageText}>{progressPercentage}%</Text>
                </View>
              )}
            </View>
          </View>
          
          {expanded && !compact && (
            <View style={styles.xpDetailRow}>
              <Text style={styles.xpDetail}>{currentLevelXP}/{totalLevelXP} XP in this level</Text>
              <View style={styles.nextLevelContainer}>
                <Zap color={colors.accent} size={14} style={styles.zapIcon} />
                <Text style={styles.nextLevelText}>{xpToNextLevel > 0 ? `${xpToNextLevel} XP to Level ${level + 1}` : 'Max Level!'}</Text>
              </View>
            </View>
          )}

          {compact && (
            <View style={styles.compactXpRow}>
              <Text style={styles.compactXpText}>{currentXP} XP</Text>
              <TouchableOpacity 
                onPress={toggleExpanded} 
                style={styles.expandButton} 
                testID="expand-button"
                activeOpacity={0.6}
              >
                <ChevronUp size={14} color={colors.textSecondary} style={expanded ? styles.chevronUp : styles.chevronDown} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {expanded && compact && (
        <View style={styles.expandedDetails}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setExpanded(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Current Level:</Text>
            <Text style={styles.expandedValue}>Level {level}</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Progress:</Text>
            <Text style={styles.expandedValue}>{currentLevelXP}/{totalLevelXP} XP ({progressPercentage}%)</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Next Level:</Text>
            <View style={styles.nextLevelContainer}>
              <Zap color={colors.accent} size={14} style={styles.zapIcon} />
              <Text style={styles.nextLevelText}>{xpToNextLevel > 0 ? `${xpToNextLevel} XP to Level ${level + 1}` : 'Max Level!'}</Text>
            </View>
          </View>
        </View>
      )}
      
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
    overflow: "visible",
  },
  compactContainer: {
    marginVertical: 0,
    marginHorizontal: 0,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0, 102, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 102, 255, 0.3)",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 120,
    overflow: "visible",
    zIndex: 1000,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelBadgeContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  compactBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
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
    borderRadius: 35,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.5,
  },
  badgeSparkle: {
    position: "absolute",
    top: -8,
    right: -8,
    opacity: 0.8,
  },
  awardIcon: {
    marginBottom: 2,
  },
  levelText: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: colors.xpColor,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  compactLevelText: {
    fontSize: 14,
  },
  xpInfoContainer: {
    flex: 1,
  },
  xpTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  xpLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendingIcon: {
    marginRight: 4,
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
    backgroundColor: "rgba(0, 102, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressContainer: {
    height: 16,
    marginBottom: 8,
  },
  compactProgressContainer: {
    height: 8,
    marginBottom: 4,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(0, 102, 255, 0.3)",
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
    position: "relative",
    overflow: "hidden",
  },
  gradientFill: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ skewX: "-20deg" }],
  },
  percentageContainer: {
    position: "absolute",
    top: 0,
    right: 8,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 10,
    fontWeight: "bold" as const,
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  compactXpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  compactXpText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.primary,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  expandButton: {
    padding: 4,
  },
  chevronUp: {
    transform: [{ rotate: "0deg" }],
  },
  chevronDown: {
    transform: [{ rotate: "180deg" }],
  },
  expandedDetails: {
    marginTop: 10,
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 102, 255, 0.2)",
    backgroundColor: "rgba(0, 0, 0, 0.98)",
    borderRadius: 12,
    position: "absolute",
    top: 55,
    right: -10,
    width: 260,
    zIndex: 999999,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 2,
    borderColor: "rgba(0, 102, 255, 0.8)",
  },
  expandedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 2,
  },
  expandedLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    flex: 1,
  },
  expandedValue: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "right",
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: colors.text,
    lineHeight: 28,
    textAlign: "center",
  },
  touchableArea: {
    // Ensure the touchable area is properly sized
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});