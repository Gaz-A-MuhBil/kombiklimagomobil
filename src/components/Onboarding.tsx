import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation, FadeIn, FadeOut, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import { colors, radius } from '../theme';
import { markIntroSeen, type IntroSlide } from '../onboarding';

// Tanıtım: görsel, durum çubuğu dahil tüm ekranı kaplar; yazılar altta koyu geçişin üstünde durur.
// Sağ üstte yuvarlak ok butonu (son sayfada onay işareti), en altta "Tanıtımı geç".
// Açılış ekranının altında hazırlanır; açılış ekranı kaybolunca doğrudan görünür.
export function Onboarding({ slides, onDone }: { slides: IntroSlide[]; onDone: () => void }) {
  const { width, height: winH } = useWindowDimensions();
  // Android'de pencere yüksekliği gezinme çubuğunu içermeyebilir; gerçek yükseklik ölçülerek kullanılır
  const [height, setHeight] = useState(winH);
  const { top, bottom } = useSafeAreaInsets();
  const list = useRef<FlatList<IntroSlide>>(null);
  const x = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const last = index === slides.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => { x.value = e.contentOffset.x; });

  const finish = () => {
    if (closing) return;
    setClosing(true);
    markIntroSeen();
    onDone();
  };
  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (last) return finish();
    list.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root]} onLayout={(e) => setHeight(e.nativeEvent.layout.height)} entering={FadeIn.duration(1)} exiting={FadeOut.duration(320)}>
      <Animated.FlatList
        ref={list}
        data={slides}
        keyExtractor={(it) => it.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => <Page slide={item} i={i} x={x} width={width} height={height} bottom={bottom} />}
      />

      <StatusBar style="light" />
      <Pressable onPress={next} accessibilityRole="button" accessibilityLabel={last ? 'Tanıtımı bitir' : 'Sonraki sayfa'}
        style={({ pressed }) => [s.next, { top: top + 12 }, pressed && s.pressed]}>
        <Ionicons name={last ? 'checkmark' : 'arrow-forward'} size={24} color={colors.primary} />
      </Pressable>

      <View style={[s.footer, { paddingBottom: bottom + 8 }]} pointerEvents="box-none">
        <View style={s.dots}>
          {slides.map((it, i) => <Dot key={it.id} i={i} x={x} width={width} />)}
        </View>
        <Pressable onPress={finish} accessibilityRole="button" hitSlop={10} style={({ pressed }) => [s.skip, pressed && { opacity: 0.6 }]}>
          <Text style={s.skipText}>Tanıtımı geç</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function Page({ slide, i, x, width, height, bottom }: { slide: IntroSlide; i: number; x: SharedValue<number>; width: number; height: number; bottom: number }) {
  const range = [(i - 1) * width, i * width, (i + 1) * width];
  // görsel hafif paralaks, yazı kayarak ve solarak gelir
  const img = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(x.value, range, [width * 0.25, 0, -width * 0.25], Extrapolation.CLAMP) }] }));
  const txt = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, range, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) }],
  }));
  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: SCRIM }}>
      <Animated.View style={[StyleSheet.absoluteFill, img]}>
        <Image source={slide.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      </Animated.View>
      {/* üstte durum çubuğu, altta yazılar okunsun diye koyu geçişler */}
      <LinearGradient colors={['rgba(11,29,69,0.45)', 'rgba(11,29,69,0)']} style={[s.shadeTop, { height: 140 }]} />
      <LinearGradient colors={['rgba(11,29,69,0)', 'rgba(11,29,69,0.7)', 'rgba(11,29,69,0.95)']} locations={[0, 0.45, 1]} style={[s.shadeBottom, { height: height * 0.5 }]} />
      <Animated.View style={[s.textBlock, { paddingBottom: bottom + 96 }, txt]}>
        <Text style={s.title}>{slide.title}</Text>
        {slide.text ? <Text style={s.text}>{slide.text}</Text> : null}
      </Animated.View>
    </View>
  );
}

function Dot({ i, x, width }: { i: number; x: SharedValue<number>; width: number }) {
  const st = useAnimatedStyle(() => {
    const d = interpolate(x.value, [(i - 1) * width, i * width, (i + 1) * width], [0, 1, 0], Extrapolation.CLAMP);
    return { width: 8 + d * 18, opacity: 0.3 + d * 0.7 };
  });
  return <Animated.View style={[s.dot, st]} />;
}

const SCRIM = '#071A2E';
const NEXT = 52;

const s = StyleSheet.create({
  root: { backgroundColor: SCRIM, zIndex: 90, elevation: 90 },
  shadeTop: { position: 'absolute', left: 0, right: 0, top: 0 },
  shadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  textBlock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  text: { color: 'rgba(255,255,255,0.85)', fontSize: 15.5, lineHeight: 23, marginTop: 10 },
  next: {
    position: 'absolute', right: 20, width: NEXT, height: NEXT, borderRadius: NEXT / 2, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.94 }] },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6, paddingVertical: 20 },
  dot: { height: 8, borderRadius: radius, backgroundColor: '#FFFFFF' },
  skip: { paddingVertical: 14, paddingLeft: 12, borderRadius: radius },
  skipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
