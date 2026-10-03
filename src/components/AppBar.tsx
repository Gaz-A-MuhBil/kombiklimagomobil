import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { useCart } from '../store/cart';

// Üst bar: solda logo (ana sayfaya döner) ya da sayfa başlığı, sağda hesabım ve sepet (ürün adedi rozetiyle)
export function AppBar({ title }: { title?: string }) {
  const { top } = useSafeAreaInsets();
  const count = useCart((s) => s.count());
  return (
    <View style={[s.bar, { paddingTop: top + 6 }]}>
      {title ? (
        <Text style={s.title} numberOfLines={1}>{title}</Text>
      ) : (
        <Pressable onPress={() => router.navigate('/')} accessibilityRole="link" accessibilityLabel="Kombi Klima GO ana sayfa" style={s.brand}>
          <Image source={require('../../assets/logo.png')} style={s.logo} contentFit="contain" />
        </Pressable>
      )}
      <View style={s.actions}>
        <IconButton icon="person-outline" label="Hesabım" onPress={() => router.navigate('/account')} />
        <IconButton icon="bag-handle-outline" label="Sepet" badge={count} onPress={() => router.navigate('/cart')} />
      </View>
    </View>
  );
}

function IconButton({ icon, label, badge, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={badge ? `${label}, ${badge} ürün` : label} hitSlop={4}
      style={({ pressed }) => [s.icon, pressed && { backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={24} color={colors.text} />
      {badge ? (
        <View style={s.badge}><Text style={s.badgeText}>{badge > 99 ? '99+' : badge}</Text></View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8,
    backgroundColor: colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  brand: { paddingHorizontal: 4, paddingVertical: 4 },
  logo: { width: 169, height: 34 }, // assets/logo.png oranı (1200×242), sitedeki başlık logosu
  title: { color: colors.text, fontSize: 20, fontWeight: '800', paddingHorizontal: 4, flex: 1 },
  actions: { flexDirection: 'row', gap: 2 },
  icon: { width: 44, height: 44, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 5, right: 3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
});
