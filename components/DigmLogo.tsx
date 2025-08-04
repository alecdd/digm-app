import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import colors from '@/constants/colors';

interface DigmLogoProps {
  size?: number;
  color?: string;
}

export default function DigmLogo({ size = 32, color = colors.primary }: DigmLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Path
          d="M15 25L45 25C60 25 72 37 72 52C72 67 60 79 45 79L35 79L35 89L15 89L15 25Z"
          fill={color}
        />
        <Path
          d="M35 45L45 45C50 45 54 49 54 54C54 59 50 63 45 63L35 63L35 45Z"
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