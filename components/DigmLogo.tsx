import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import colors from '@/constants/colors';

interface DigmLogoProps {
  size?: number;
  color?: string;
  style?: object;
}

export default function DigmLogo({ size = 32, color = colors.primary, style }: DigmLogoProps) {
  // Create unique gradient IDs to prevent conflicts when multiple logos are rendered
  const gradientId = `logoGradient-${Math.random().toString(36).substring(2, 9)}`;
  const glowId = `logoGlow-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
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
        </Defs>
        
        {/* Glow effect */}
        <Circle
          cx="50"
          cy="50"
          r="48"
          fill={`url(#${glowId})`}
          opacity="0.6"
        />
        
        {/* Outer circle */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          fill={`url(#${gradientId})`}
          stroke={colors.primaryLight}
          strokeWidth="1.5"
        />
        
        {/* Inner D shape with improved path */}
        <G>
          <Path
            d="M28 25 L45 25 C65 25 75 35 75 50 C75 65 65 75 45 75 L28 75 Z M36 33 L36 67 L45 67 C59 67 67 59 67 50 C67 41 59 33 45 33 Z"
            fill="white"
            fillRule="evenodd"
          />
        </G>
        
        {/* Accent dot with glow */}
        <Circle
          cx="70"
          cy="30"
          r="5"
          fill="white"
          opacity="0.9"
        />
        <Circle
          cx="70"
          cy="30"
          r="7"
          fill="white"
          opacity="0.3"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});