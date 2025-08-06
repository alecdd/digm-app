import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G, RadialGradient } from 'react-native-svg';
import colors from '@/constants/colors';

interface DigmLogoProps {
  size?: number;
  color?: string;
  style?: object;
  animated?: boolean;
}

export default function DigmLogo({ size = 32, color = colors.primary, style, animated = true }: DigmLogoProps) {
  // Create unique gradient IDs to prevent conflicts when multiple logos are rendered
  const gradientId = `logoGradient-${Math.random().toString(36).substring(2, 9)}`;
  const glowId = `logoGlow-${Math.random().toString(36).substring(2, 9)}`;
  const radialGlowId = `radialGlow-${Math.random().toString(36).substring(2, 9)}`;
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0.6)).current;
  
  // Start animations
  useEffect(() => {
    if (animated) {
      // Subtle pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      
      // Glow animation
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacityAnim, {
            toValue: 0.8,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacityAnim, {
            toValue: 0.6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      
      // Very slow rotation for a subtle effect
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000, // 20 seconds for a full rotation
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      // Start all animations
      pulse.start();
      glow.start();
      rotate.start();
      
      return () => {
        pulse.stop();
        glow.stop();
        rotate.stop();
      };
    }
  }, [animated, pulseAnim, glowOpacityAnim, rotateAnim]);
  
  // Calculate rotation degrees for animation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { width: size, height: size }, 
        style,
        animated && {
          transform: [{ scale: pulseAnim }]
        }
      ]}
      testID="digm-logo"
    >
      <Animated.View style={animated ? { transform: [{ rotate: spin }] } : undefined}>
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.primaryLight} stopOpacity="0.9" />
            </LinearGradient>
            
            <LinearGradient id={glowId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={colors.primaryLight} stopOpacity="0.4" />
            </LinearGradient>
            
            <RadialGradient 
              id={radialGlowId} 
              cx="50" 
              cy="50" 
              r="50" 
              fx="50" 
              fy="50" 
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
              <Stop offset="70%" stopColor={colors.primary} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          
          {/* Outer glow effect */}
          <Animated.View style={{ opacity: animated ? glowOpacityAnim : 0.6 }}>
            <Circle
              cx="50"
              cy="50"
              r="48"
              fill={`url(#${radialGlowId})`}
            />
          </Animated.View>
          
          {/* Inner glow effect */}
          <Circle
            cx="50"
            cy="50"
            r="46"
            fill={`url(#${glowId})`}
            opacity="0.6"
          />
          
          {/* Outer circle */}
          <Circle
            cx="50"
            cy="50"
            r="42"
            fill={`url(#${gradientId})`}
            stroke={colors.primaryLight}
            strokeWidth="1.5"
          />
          
          {/* Inner D shape with improved path */}
          <G>
            <Path
              d="M30 28 L45 28 C63 28 72 37 72 50 C72 63 63 72 45 72 L30 72 Z M38 36 L38 64 L45 64 C57 64 64 57 64 50 C64 43 57 36 45 36 Z"
              fill="white"
              fillRule="evenodd"
            />
          </G>
          
          {/* Accent dot with glow */}
          <Circle
            cx="68"
            cy="32"
            r="6"
            fill="white"
            opacity="0.9"
          />
          <Circle
            cx="68"
            cy="32"
            r="8"
            fill="white"
            opacity="0.3"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});