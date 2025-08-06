import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Platform, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import colors from '@/constants/colors';
import { Award, Star, Zap } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LevelUpEffectProps {
  visible: boolean;
  message?: string;
  onAnimationEnd?: () => void;
}

export default function LevelUpEffect({ 
  visible, 
  message = "Keep Going! You're Getting Closer to Your Goals and Vision, You Undeniably Relentless One!", 
  onAnimationEnd 
}: LevelUpEffectProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (visible) {
      // Reset animation values
      opacity.setValue(0);
      scale.setValue(0.8);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
      
      // Start animations
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.5,
              duration: 1500,
              useNativeDriver: true,
            })
          ])
        ),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          })
        )
      ]).start();
      
      // Trigger confetti
      if (confettiRef.current && Platform.OS !== 'web') {
        confettiRef.current.start();
        
        // Fire additional rounds of confetti for more impact
        setTimeout(() => confettiRef.current?.start(), 800);
        setTimeout(() => confettiRef.current?.start(), 1600);
      }
      
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onAnimationEnd?.();
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, opacity, scale, rotateAnim, glowAnim, onAnimationEnd]);

  if (!visible) return null;
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={[styles.container, { position: 'absolute', width: '100%', height: '100%' }]} testID="level-up-effect">
      <Animated.View 
        style={[
          styles.backgroundGlow,
          {
            opacity: glowAnim,
            transform: [{ scale: glowAnim.interpolate({ inputRange: [0.5, 1], outputRange: [1.2, 1.5] }) }]
          }
        ]}
      />
      
      <Animated.View 
        style={[
          styles.messageContainer,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.spinningIcon, { transform: [{ rotate: spin }] }]}>
            <Star color="#FFD700" size={40} fill="#FFD700" style={styles.starIcon} />
          </Animated.View>
          <Award color={colors.primary} size={60} fill={colors.primary} style={styles.awardIcon} />
        </View>
        
        <Text style={styles.title}>LEVEL UP!</Text>
        <View style={styles.divider} />
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.zapContainer}>
          <Zap color={colors.accent} size={24} fill={colors.accent} style={styles.zapIcon} />
          <Text style={styles.continueText}>Keep pushing your limits!</Text>
        </View>
      </Animated.View>
      
      {Platform.OS !== 'web' && (
        <>
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: screenWidth / 2, y: 0 }}
            autoStart={false}
            fadeOut
            explosionSpeed={350}
            fallSpeed={3000}
            colors={['#0066FF', '#3385FF', '#FFFFFF', '#FFD700', '#FF6B6B', '#4CAF50']}
          />
          <ConfettiCannon
            count={150}
            origin={{ x: 0, y: screenHeight / 3 }}
            autoStart={visible}
            fadeOut
            explosionSpeed={300}
            fallSpeed={2500}
            colors={['#0066FF', '#3385FF', '#FFFFFF', '#FFD700', '#FF6B6B', '#4CAF50']}
          />
          <ConfettiCannon
            count={150}
            origin={{ x: screenWidth, y: screenHeight / 3 }}
            autoStart={visible}
            fadeOut
            explosionSpeed={300}
            fallSpeed={2500}
            colors={['#0066FF', '#3385FF', '#FFFFFF', '#FFD700', '#FF6B6B', '#4CAF50']}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000, // Higher than GoalCompletionEffect to ensure it's on top
    backgroundColor: 'rgba(0,0,0,0.85)',
    elevation: 1000,
  },
  backgroundGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  messageContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  spinningIcon: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  awardIcon: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: colors.primary,
    marginBottom: 16,
    opacity: 0.5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  message: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  zapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  zapIcon: {
    marginRight: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
  },
});