import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { colors, radius } from '../theme';
import { tl } from '../data';
import { router } from 'expo-router';
import { useCart, type Product } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { discount } from '../useProducts';

// Ürün kartı: görsel, indirim rozeti, favori, marka, ad, fiyat ve sepete ekle. Dokununca uygulamadaki ürün detayı açılır.
export function ProductTile({ product: p, width }: { product: Product; width: number }) {
  const qty = useCart((s) => s.items.find((i) => i.id === p.id)?.qty ?? 0);
  const fav = useFavorites((s) => s.ids.includes(p.id));
  const toggle = useFavorites((s) => s.toggle);
  const off = discount(p);
  const priced = p.price > 0;

  return (
    <Pressable onPress={() => p.slug && router.push({ pathname: '/product/[slug]', params: { slug: p.slug } })} style={[s.card, { width }]} accessibilityLabel={p.name}>
      <View style={[s.imgBox, { height: width }]}>
        {p.imageUrl ? <Image source={p.imageUrl} style={s.img} contentFit="cover" transition={200} /> : <Ionicons name="image-outline" size={28} color={colors.border} />}
        {off > 0 && <View style={s.off}><Text style={s.offText}>%{off}</Text></View>}
        <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); toggle(p.id); }} hitSlop={6}
          accessibilityRole="button" accessibilityLabel={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'} style={s.fav}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? '#E11D48' : colors.muted} />
        </Pressable>
      </View>
      <Text style={s.brand} numberOfLines={1}>{p.brand}</Text>
      <Text style={s.name} numberOfLines={2}>{p.name}</Text>
      <View style={s.bottom}>
        <View style={{ flex: 1 }}>
          {off > 0 && <Text style={s.old}>{tl(p.oldPrice!)}</Text>}
          <Text style={s.price} numberOfLines={1}>{priced ? tl(p.price) : 'Fiyat sorunuz'}</Text>
        </View>
        {priced && (qty > 0 ? <Stepper product={p} qty={qty} /> : (
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); useCart.getState().add(p); }}
            accessibilityRole="button" accessibilityLabel="Sepete ekle" style={({ pressed }) => [s.add, pressed && { opacity: 0.8 }]}>
            <Ionicons name="bag-add-outline" size={18} color="#FFFFFF" />
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}

// Sepetteki ürün için sepet sayfasındaki gibi − adet +; 1'in altına inince sepetten çıkar ve tekrar ekle ikonu görünür
function Stepper({ product: p, qty }: { product: Product; qty: number }) {
  const set = (n: number) => { Haptics.selectionAsync().catch(() => {}); useCart.getState().setQty(p.id, n); };
  return (
    <Animated.View entering={ZoomIn.duration(180)} style={s.stepper} accessibilityLabel={`Sepette ${qty} adet`}>
      <Pressable onPress={() => set(qty - 1)} hitSlop={4} style={s.step} accessibilityRole="button" accessibilityLabel={qty === 1 ? 'Sepetten çıkar' : 'Azalt'}>
        <Ionicons name="remove" size={16} color={colors.primary} />
      </Pressable>
      <Text style={s.qty}>{qty}</Text>
      <Pressable onPress={() => set(qty + 1)} hitSlop={4} style={s.step} accessibilityRole="button" accessibilityLabel="Arttır">
        <Ionicons name="add" size={16} color={colors.primary} />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.bg },
  // görsel çerçevesiz, alanın tamamını kaplar
  imgBox: { borderRadius: radius, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  off: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E11D48', borderRadius: radius, paddingHorizontal: 6, paddingVertical: 3 },
  offText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  fav: { position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.muted, fontSize: 11.5, fontWeight: '600', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { color: colors.text, fontSize: 13.5, fontWeight: '600', lineHeight: 18, marginTop: 2, minHeight: 36 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6, gap: 6 },
  old: { color: colors.muted, fontSize: 11.5, textDecorationLine: 'line-through' },
  price: { color: colors.primary, fontSize: 15.5, fontWeight: '800' },
  stepper: { height: 36, flexDirection: 'row', alignItems: 'center', borderRadius: radius, borderWidth: 1.5, borderColor: colors.primary },
  step: { width: 30, height: '100%', alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 18, textAlign: 'center', color: colors.primary, fontSize: 14, fontWeight: '800' },
  add: { width: 36, height: 36, borderRadius: radius, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
