import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useFavPulse } from '../store/favorites';

const SHOW_MS = 1100;

// Favoriye ekleyince ekranın ortasında kısa süreli bildirim: kalp "pıt" diye büyür, etrafından halka yayılır, sonra kaybolur.
// Çıkarınca aynı kart sade bir kırık kalple görünür. Dokunmayı engellemez.
export function FavoriteToast() {
  const { n, added } = useFavPulse();
  const [doneN, setDoneN] = useState(0); // süresi dolan son bildirim

  useEffect(() => {
    if (!n) return;
    const t = setTimeout(() => setDoneN(n), SHOW_MS);
    return () => clearTimeout(t);
  }, [n]);

  if (!n || doneN === n) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* her yeni değişiklikte animasyon baştan başlasın diye sayaç anahtar olarak kullanılır */}
      <View style={s.center}><Burst key={n} added={added} /></View>
    </View>
  );
}

function Burst({ added }: { added: boolean }) {
  const card = useSharedValue(0);
  const heart = useSharedValue(0.3);
  const ring = useSharedValue(0);

  useEffect(() => {
    card.value = withSequence(
      withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) }),
      withDelay(SHOW_MS - 420, withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) }))
    );
    heart.value = withDelay(60, withSpring(1, { damping: 7, stiffness: 260, mass: 0.6 }));
    ring.value = withDelay(90, withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca görünürken bir kez oynar
  }, []);

  const cardStyle = useAnimatedStyle(() => ({ opacity: card.value, transform: [{ scale: 0.85 + card.value * 0.15 }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: (1 - ring.value) * 0.7, transform: [{ scale: 0.6 + ring.value * 1.1 }] }));

  return (
    <Animated.View style={[s.card, cardStyle]} accessibilityLiveRegion="polite" accessibilityLabel={added ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı'}>
      <View style={s.iconWrap}>
        {added && <Animated.View style={[s.ring, ringStyle]} />}
        <Animated.View style={heartStyle}>
          <Ionicons name={added ? 'heart' : 'heart-dislike-outline'} size={46} color={added ? '#F43F5E' : '#FFFFFF'} />
        </Animated.View>
      </View>
      <Text style={s.text}>{added ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı'}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    minWidth: 168, paddingHorizontal: 22, paddingVertical: 20, borderRadius: 4, alignItems: 'center',
    backgroundColor: 'rgba(11,29,69,0.95)',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  iconWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#F43F5E' },
  text: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700', marginTop: 8 },
});
