import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Animated, Platform, Dimensions, Modal } from 'react-native';
import colors from '@/constants/colors';
import { CheckCircle, Target, Plus } from '@/lib/icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

let ConfettiCannon: any = null;
if (Platform.OS !== 'web') {
  try {
    const mod = require('react-native-confetti-cannon');
    ConfettiCannon = mod.default || mod;
    console.log('✅ LevelUpEffect: ConfettiCannon loaded');
  } catch (e) {
    console.warn('❌ LevelUpEffect: ConfettiCannon unavailable in Expo Go. Falling back to emoji particles.');
  }
} else {
  console.log('🌐 LevelUpEffect: Web detected - using emoji particles');
}

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
  const confettiRef = useRef<any>(null);

  const emojiBursts = useMemo(() => {
    const pool = ['🎉', '✨', '🏆', '🌟', '💥', '🔥', '💫'];
    return new Array(24).fill(null).map((_, i) => ({
      key: `emoji-${i}`,
      char: pool[i % pool.length],
      left: Math.random() * (screenWidth - 40) + 20,
      delay: Math.random() * 400,
      duration: 1800 + Math.random() * 1200,
      startY: -30 - Math.random() * 80,
      endY: screenHeight + 60,
      rotate: (Math.random() * 2 - 1) * 120,
      size: 18 + Math.random() * 16,
    }));
  }, []);

  const emojiAnimVals = useRef(
    emojiBursts.map(() => ({
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    console.log('🎉 LevelUpEffect visible:', visible);
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.8);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
          ])
        ),
        Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true })),
      ]).start();

      if (Platform.OS !== 'web' && ConfettiCannon && confettiRef.current) {
        confettiRef.current.start?.();
        setTimeout(() => confettiRef.current?.start?.(), 800);
        setTimeout(() => confettiRef.current?.start?.(), 1600);
      } else {
        emojiAnimVals.forEach((vals, i) => {
          vals.translateY.setValue(0);
          vals.rotate.setValue(0);
          vals.opacity.setValue(0);
          const cfg = emojiBursts[i];
          Animated.sequence([
            Animated.delay(cfg.delay),
            Animated.parallel([
              Animated.timing(vals.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.timing(vals.translateY, { toValue: cfg.endY - cfg.startY, duration: cfg.duration, useNativeDriver: true }),
              Animated.timing(vals.rotate, { toValue: cfg.rotate, duration: cfg.duration, useNativeDriver: true }),
            ]),
            Animated.timing(vals.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();
        });
      }

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.8, duration: 500, useNativeDriver: true }),
        ]).start(() => {
          onAnimationEnd?.();
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, opacity, scale, rotateAnim, glowAnim, onAnimationEnd, emojiAnimVals, emojiBursts]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnimationEnd}>
      <View style={styles.modalRoot}>
        <View style={styles.container} testID="level-up-effect">
          <Animated.View
            style={[
              styles.backgroundGlow,
              { opacity: glowAnim, transform: [{ scale: glowAnim.interpolate({ inputRange: [0.5, 1], outputRange: [1.2, 1.5] }) }] }
            ]}
          />

          <Animated.View
            style={[
              styles.messageContainer,
              { opacity, transform: [{ scale }] }
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.iconContainer}>
              <Animated.View style={[styles.spinningIcon, { transform: [{ rotate: spin }] }]}>
                <Target color="#FFD700" size={40} style={styles.starIcon} />
              </Animated.View>
              <CheckCircle color={colors.primary} size={60} style={styles.awardIcon} />
            </View>
            <Text style={styles.title}>LEVEL UP!</Text>
            <View style={styles.divider} />
            <Text style={styles.message}>{message}</Text>
            <View style={styles.zapContainer}>
              <Plus color={colors.accent} size={24} style={styles.zapIcon} />
              <Text style={styles.continueText}>Keep pushing your limits!</Text>
            </View>
          </Animated.View>

          {(Platform.OS !== 'web' && ConfettiCannon) ? (
            <>
              <ConfettiCannon
                ref={confettiRef}
                count={220}
                origin={{ x: screenWidth / 2, y: 0 }}
                autoStart={false}
                fadeOut
                explosionSpeed={350}
                fallSpeed={3000}
                colors={['#0066FF', '#3385FF', '#FFFFFF', '#FFD700', '#FF6B6B', '#4CAF50']}
              />
            </>
          ) : (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {emojiBursts.map((cfg, i) => {
                const vals = emojiAnimVals[i];
                const rotate = vals.rotate.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] });
                return (
                  <Animated.Text
                    key={cfg.key}
                    style={{
                      position: 'absolute',
                      left: cfg.left,
                      top: cfg.startY,
                      fontSize: cfg.size,
                      transform: [{ translateY: vals.translateY }, { rotate }],
                      opacity: vals.opacity,
                    }}
                  >
                    {cfg.char}
                  </Animated.Text>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
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