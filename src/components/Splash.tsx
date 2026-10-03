import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

// Açılış ekranı: yerel (native) splash ile aynı zeminde ve aynı konumda başlar, böylece geçiş görünmez.
// Sade akış: sitedeki logo bir an durur, hafifçe yukarı kayar, altında ince çizgi ve slogan belirir, ekran yumuşakça açılır.
export const SPLASH_BG = '#FFFFFF';
const LOGO_W = 240;
const LOGO_H = (LOGO_W * 242) / 1200; // assets/logo.png oranı (app.json imageWidth ile aynı genişlik)
const EXIT_AT = 3400;
const EXIT_MS = 600;

const out = Easing.out(Easing.cubic);
const t = (ms: number, delay: number) => withDelay(delay, withTiming(1, { duration: ms, easing: out }));

export function Splash({ onDone }: { onDone: () => void }) {
  const lift = useSharedValue(0);
  const line = useSharedValue(0);
  const tag = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    lift.value = t(900, 900);
    line.value = t(800, 1400);
    tag.value = t(800, 1650);
    exit.value = withDelay(EXIT_AT, withTiming(1, { duration: EXIT_MS, easing: Easing.inOut(Easing.quad) }));
    const done = setTimeout(onDone, EXIT_AT + EXIT_MS + 30);
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca açılışta bir kez oynar
  }, []);

  const root = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const logo = useAnimatedStyle(() => ({ transform: [{ translateY: -24 * lift.value }] }));
  const tagStyle = useFadeUp(tag, 6);
  const lineStyle = useAnimatedStyle(() => ({ opacity: line.value, transform: [{ scaleX: line.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root, root]} pointerEvents="none" onLayout={() => SplashScreen.hideAsync().catch(() => {})}>
      <StatusBar style="dark" />
      <Animated.View style={[{ width: LOGO_W, height: LOGO_H }, logo]}>
        <Image source={require('../../assets/logo.png')} style={StyleSheet.absoluteFill} contentFit="contain" />
      </Animated.View>

      <View style={s.textBlock}>
        <Animated.View style={[s.line, lineStyle]} />
        <Animated.Text style={[s.tag, tagStyle]}>Isıtma · Soğutma · Doğalgaz Çözümleri</Animated.Text>
      </View>
    </Animated.View>
  );
}

const useFadeUp = (v: SharedValue<number>, dy: number) =>
  useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: dy * (1 - v.value) }] }));

const s = StyleSheet.create({
  root: { backgroundColor: SPLASH_BG, zIndex: 100, elevation: 100, alignItems: 'center', justifyContent: 'center' },
  textBlock: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: 16, alignItems: 'center' },
  line: { width: 40, height: 2, borderRadius: 1, backgroundColor: colors.accent, marginBottom: 14 },
  tag: { color: colors.muted, fontSize: 12.5, letterSpacing: 0.4 },
});
