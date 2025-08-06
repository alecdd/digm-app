import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import colors from '@/constants/colors';

interface DigmLogoProps {
  size?: number;
  color?: string;
}

export default function DigmLogo({ size = 32, color = colors.primary }: DigmLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        
        {/* Outer circle */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#logoGradient)"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Inner D shape */}
        <Path
          d="M25 25 L45 25 C65 25 75 35 75 50 C75 65 65 75 45 75 L25 75 Z M35 35 L35 65 L45 65 C58 65 65 58 65 50 C65 42 58 35 45 35 Z"
          fill="white"
          fillRule="evenodd"
        />
        
        {/* Accent dot */}
        <Circle
          cx="70"
          cy="30"
          r="4"
          fill="white"
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