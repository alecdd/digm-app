import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Platform } from 'react-native';
import colors from '@/constants/colors';

// Conditionally import ConfettiCannon only for native platforms
let ConfettiCannon: any = null;
if (Platform.OS !== 'web') {
  try {
    const ConfettiCannonModule = require('react-native-confetti-cannon');
    ConfettiCannon = ConfettiCannonModule.default || ConfettiCannonModule;
    console.log('✅ ConfettiCannon loaded successfully');
  } catch (e) {
    console.warn('❌ ConfettiCannon not available:', e);
  }
} else {
  console.log('🌐 Web platform detected - ConfettiCannon disabled');
}

interface GoalCompletionEffectProps {
  visible: boolean;
  goalTitle: string;
  onAnimationEnd?: () => void;
}

export default function GoalCompletionEffect({ 
  visible, 
  goalTitle,
  onAnimationEnd 
}: GoalCompletionEffectProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    console.log('🎊 GoalCompletionEffect: Effect triggered. Visible:', visible, 'Goal:', goalTitle);
    
    if (visible) {
      console.log('🎊 GoalCompletionEffect: Starting animation for goal:', goalTitle);
      
      // Reset animation values
      opacity.setValue(0);
      scale.setValue(0.8);
      
      // Start animations
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Trigger confetti
      if (Platform.OS !== 'web' && ConfettiCannon) {
        console.log('🎆 Triggering confetti cannon!');
        // Small delay to ensure component is mounted
        setTimeout(() => {
          if (confettiRef.current) {
            confettiRef.current.start();
          }
        }, 100);
      } else {
        console.log('🎆 Confetti not available - Platform:', Platform.OS, 'ConfettiCannon:', !!ConfettiCannon);
      }
      
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        console.log('🎊 GoalCompletionEffect: Hiding animation');
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onAnimationEnd?.();
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, opacity, scale, onAnimationEnd, goalTitle]);

  if (!visible) return null;

  return (
    <View style={styles.container} testID="goal-completion-effect">
      <Animated.View 
        style={[
          styles.messageContainer,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}
      >
        <Text style={styles.title}>🏆 GOAL COMPLETED! 🏆</Text>
        <Text style={styles.goalTitle}>{goalTitle}</Text>
        <Text style={styles.quote}>&quot;A goal without a plan is just a wish.&quot;</Text>
        <Text style={styles.message}>
          You are one step closer to your Vision
          {'\n\n'}
          +50 XP
        </Text>
      </Animated.View>
      
      {Platform.OS !== 'web' && ConfettiCannon && (
        <ConfettiCannon
          ref={confettiRef}
          count={300}
          origin={{ x: 0, y: 0 }}
          autoStart={false}
          fadeOut
          explosionSpeed={350}
          fallSpeed={3000}
          colors={['#0066FF', '#3385FF', '#FFFFFF', '#FFD700', '#FF6B6B', '#4CAF50']}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quote: {
    fontSize: 18,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Lower than LevelUpEffect (10000)
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  messageContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
  },
});