import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../../src/theme';
import { AppBar } from '../../src/components/AppBar';
import { ProductGrid } from '../../src/components/ProductGrid';
import { discount, onSale, useProducts } from '../../src/useProducts';

// Kampanyalar: indirimdeki tüm ürünler, en yüksek indirim önce
export default function Campaigns() {
  const { products, loading } = useProducts();
  const deals = useMemo(() => products.filter(onSale).sort((a, b) => discount(b) - discount(a)), [products]);
  const best = deals[0] ? discount(deals[0]) : 0;

  const header = (
    <LinearGradient colors={['#071A2E', colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
      <View style={{ flex: 1 }}>
        <Text style={s.eyebrow}>Kampanyalı ürünler</Text>
        <Text style={s.title}>{deals.length ? `${deals.length} üründe indirim` : 'Kampanyalar'}</Text>
        {best > 0 && <Text style={s.sub}>%{best}&apos;e varan indirimleri kaçırmayın</Text>}
      </View>
      <MaterialCommunityIcons name="tag-heart-outline" size={52} color="rgba(255,255,255,0.9)" />
    </LinearGradient>
  );

  return (
    <View style={s.screen}>
      <AppBar title="Kampanyalar" />
      <ProductGrid data={deals} header={header} empty={loading ? 'Kampanyalar yükleniyor…' : 'Şu an kampanyalı ürün bulunmuyor.'} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, padding: 18, borderRadius: radius },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 4 },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
});
