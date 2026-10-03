import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../../src/theme';
import { AppBar } from '../../src/components/AppBar';
import { ProductGrid } from '../../src/components/ProductGrid';
import { iconFor, orderCategories } from '../../src/categories';
import { useSeason } from '../../src/useSeason';
import { useProducts } from '../../src/useProducts';

const norm = (t: string) => t.toLocaleLowerCase('tr-TR');

// Kategoriler: üstte arama, kategori seçimi, altta ürünler. Ana sayfadan ?c=Kombi ya da ?ara=1 ile açılabilir.
export default function Categories() {
  const params = useLocalSearchParams<{ c?: string; ara?: string }>();
  const { products, loading } = useProducts();
  const [cat, setCat] = useState<string | null>(params.c ?? null);
  const [q, setQ] = useState('');
  const input = useRef<TextInput>(null);

  // başka sekmeden yeni bir kategoriyle gelindiğinde onu seç
  const [lastC, setLastC] = useState(params.c);
  if (params.c !== lastC) {
    setLastC(params.c);
    if (params.c) setCat(params.c);
  }
  useEffect(() => { if (params.ara) setTimeout(() => input.current?.focus(), 250); }, [params.ara]);

  const order = useSeason((st) => st.order);
  const cats = useMemo(() => orderCategories(products.map((p) => p.category), order), [products, order]);
  const list = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return products.filter((p) => (!cat || p.category === cat) && words.every((w) => norm(`${p.name} ${p.brand} ${p.category}`).includes(w)));
  }, [products, cat, q]);

  const header = (
    <View style={{ marginBottom: 4 }}>
      <View style={s.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput ref={input} value={q} onChangeText={setQ} placeholder="Ürün veya marka ara" placeholderTextColor={colors.muted}
          style={s.input} returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" />
        {q ? <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Aramayı temizle"><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} keyboardShouldPersistTaps="handled">
        <Chip label="Tümü" active={!cat} onPress={() => setCat(null)} />
        {cats.map((c) => <Chip key={c} label={c} icon={iconFor(c)} active={cat === c} onPress={() => setCat(cat === c ? null : c)} />)}
      </ScrollView>
      <Text style={s.count}>{loading ? 'Ürünler yükleniyor…' : `${list.length} ürün`}</Text>
    </View>
  );

  return (
    <View style={s.screen}>
      <AppBar title={cat ?? 'Kategoriler'} />
      <ProductGrid data={list} header={header} empty={q ? `"${q}" için sonuç bulunamadı.` : 'Bu kategoride ürün yok.'} />
    </View>
  );
}

function Chip({ label, icon, active, onPress }: { label: string; icon?: ReturnType<typeof iconFor>; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={[s.chip, active && s.chipOn]}>
      {icon && <MaterialCommunityIcons name={icon} size={16} color={active ? '#FFFFFF' : colors.primary} />}
      <Text style={[s.chipText, active && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, height: 46, paddingHorizontal: 14,
    borderRadius: radius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  chips: { paddingHorizontal: 16, gap: 8, paddingTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  count: { color: colors.muted, fontSize: 12.5, paddingHorizontal: 16, marginTop: 12 },
});
