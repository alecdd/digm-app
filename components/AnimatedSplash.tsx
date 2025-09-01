import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";

interface AnimatedSplashProps {
  visible: boolean;
}

export default function AnimatedSplash({ visible }: AnimatedSplashProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const titleY = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      // fade overlay out when parent toggles invisible
      Animated.timing(containerOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start();
      return;
    }
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible, opacity, scale, titleY, subtitleOpacity, containerOpacity]);

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: containerOpacity }]}> 
      <Animated.View style={[styles.inner, { opacity }]}> 
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image source={require("@/assets/images/splash-icon.png")} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Animated.Text style={[styles.title, { transform: [{ translateY: titleY }] }]}>DIGM</Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>For the Relentless Ones</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  inner: { alignItems: "center", justifyContent: "center" },
  logo: { width: 160, height: 160 },
  title: { marginTop: 18, fontSize: 56, fontWeight: "900", color: colors.primaryLight, letterSpacing: 1.5 },
  subtitle: { marginTop: 6, fontSize: 14, color: "#fff" },
});


