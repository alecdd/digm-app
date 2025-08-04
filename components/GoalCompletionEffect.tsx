import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Platform } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import colors from '@/constants/colors';

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
    if (visible) {
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
      if (confettiRef.current && Platform.OS !== 'web') {
        confettiRef.current.start();
      }
      
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
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
  }, [visible, opacity, scale, onAnimationEnd]);

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
        <Text style={styles.message}>
          Congratulations! You&apos;ve successfully completed your goal.
          {'\n\n'}
          +25 XP
        </Text>
      </Animated.View>
      
      {Platform.OS !== 'web' && (
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
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.8)',
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