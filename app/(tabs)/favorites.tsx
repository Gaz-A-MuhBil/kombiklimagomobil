import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../src/theme';
import { AppBar } from '../../src/components/AppBar';
import { ProductGrid } from '../../src/components/ProductGrid';
import { useFavorites } from '../../src/store/favorites';
import { useProducts } from '../../src/useProducts';

// Favoriler: kalp ile işaretlenen ürünler (telefonda saklanır), en son eklenen önce
export default function Favorites() {
  const { products } = useProducts();
  const ids = useFavorites((s) => s.ids);
  const list = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p) => !!p);
  }, [products, ids]);

  const empty = (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Ionicons name="heart-outline" size={34} color={colors.primary} /></View>
      <Text style={s.emptyTitle}>Henüz favoriniz yok</Text>
      <Text style={s.emptyText}>Beğendiğiniz ürünlerdeki kalp simgesine dokunun; burada listelensin.</Text>
      <Pressable onPress={() => router.navigate('/categories')} style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]} accessibilityRole="button">
        <Text style={s.btnText}>Ürünleri keşfet</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={s.screen}>
      <AppBar title="Favoriler" />
      <ProductGrid data={list} empty={empty} header={list.length ? <Text style={s.count}>{list.length} ürün</Text> : undefined} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  count: { color: colors.muted, fontSize: 12.5, paddingHorizontal: 16, paddingTop: 14 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 72 },
  emptyIcon: { width: 72, height: 72, borderRadius: radius, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 18 },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 6 },
  btn: { marginTop: 20, backgroundColor: colors.primary, borderRadius: radius, paddingHorizontal: 22, paddingVertical: 13 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
