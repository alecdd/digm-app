import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Platform, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import colors from '@/constants/colors';

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
          duration: 500,
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
        
        // Fire a second round of confetti after a delay for more impact
        setTimeout(() => {
          if (confettiRef.current) {
            confettiRef.current.start();
          }
        }, 1000);
      }
      
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
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
  }, [visible, opacity, scale, onAnimationEnd]);

  if (!visible) return null;

  return (
    <View style={styles.container} testID="level-up-effect">
      <Animated.View 
        style={[
          styles.messageContainer,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}
      >
        <Text style={styles.title}>🎉 LEVEL UP! 🎉</Text>
        <Text style={styles.message}>{message}</Text>
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
            count={200}
            origin={{ x: 0, y: screenHeight / 3 }}
            autoStart={visible}
            fadeOut
            explosionSpeed={300}
            fallSpeed={2500}
            colors={['#0066FF', '#3385FF', '#FFFFFF', '#FFD700', '#FF6B6B', '#4CAF50']}
          />
          <ConfettiCannon
            count={200}
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
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.85)',
    elevation: 1000,
  },
  messageContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    // Add a subtle glow effect
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  message: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
});