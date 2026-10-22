import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../../src/theme';
import { AppBar } from '../../src/components/AppBar';
import { ProductGrid } from '../../src/components/ProductGrid';
import { FilterBar, FilterSheet, SortSheet } from '../../src/components/ProductFilters';
import { iconFor, orderCategories } from '../../src/categories';
import { NO_EXTRA, SORTS, applyFilters, facetOptions, facetsFor, selectedCount, sortProducts, sortsFor, type Extra, type Selection, type SortKey } from '../../src/filters';
import { useSeason } from '../../src/useSeason';
import { useProducts } from '../../src/useProducts';

const norm = (t: string) => t.toLocaleLowerCase('tr-TR');

// Kategoriler: üstte arama, kategori seçimi, filtre ve sıralama, altta ürünler. Ana sayfadan ?c=Kombi ya da ?ara=1 ile açılabilir.
export default function Categories() {
  const params = useLocalSearchParams<{ c?: string; ara?: string }>();
  const { products, loading } = useProducts();
  const [cat, setCat] = useState<string | null>(params.c ?? null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Selection>({});
  const [extra, setExtra] = useState<Extra>(NO_EXTRA);
  const [sort, setSort] = useState<SortKey>('onerilen');
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);
  const input = useRef<TextInput>(null);

  // Kategori değişince o kategoriye özel filtreler (kW, BTU…) sıfırlanır; marka, fiyat ve durum kalır
  const choose = (c: string | null) => {
    setCat(c);
    setSel((prev): Selection => (prev.marka?.length ? { marka: prev.marka } : {}));
    if (!c && sort.startsWith('kapasite')) setSort('onerilen');
  };

  // başka sekmeden yeni bir kategoriyle gelindiğinde onu seç
  const [lastC, setLastC] = useState(params.c);
  if (params.c !== lastC) {
    setLastC(params.c);
    if (params.c) choose(params.c);
  }
  useEffect(() => { if (params.ara) setTimeout(() => input.current?.focus(), 250); }, [params.ara]);

  const order = useSeason((st) => st.order);
  const cats = useMemo(() => orderCategories(products.map((p) => p.category), order), [products, order]);
  const base = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return products.filter((p) => (!cat || p.category === cat) && words.every((w) => norm(`${p.name} ${p.brand} ${p.category}`).includes(w)));
  }, [products, cat, q]);

  const facets = useMemo(() => facetsFor(cat, base), [cat, base]);
  const options = useMemo(() => facetOptions(base, facets, sel, extra), [base, facets, sel, extra]);
  const list = useMemo(() => sortProducts(applyFilters(base, facets, sel, extra), sort), [base, facets, sel, extra, sort]);
  const sorts = useMemo(() => sortsFor(cat, base), [cat, base]);
  const priceRange = useMemo(() => {
    const prices = base.map((p) => p.price).filter((n) => n > 0);
    return prices.length ? ([Math.min(...prices), Math.max(...prices)] as [number, number]) : null;
  }, [base]);

  // yalnızca bu listede geçerli olan seçimler sayılır ve etiket olarak gösterilir
  const valid = useMemo(() => Object.fromEntries(facets.map((f) => [f.key, sel[f.key] ?? []])), [facets, sel]);
  const count = selectedCount(valid, extra);
  const toggle = (key: string, value: string) =>
    setSel((s) => ({ ...s, [key]: s[key]?.includes(value) ? s[key].filter((v) => v !== value) : [...(s[key] ?? []), value] }));
  const clear = () => { setSel({}); setExtra(NO_EXTRA); };
  const chips = [
    ...facets.flatMap((f) => (valid[f.key] ?? []).map((v) => ({ label: v, remove: () => toggle(f.key, v) }))),
    ...(extra.min || extra.max ? [{ label: priceLabel(extra), remove: () => setExtra((e) => ({ ...e, min: '', max: '' })) }] : []),
    ...(extra.inStock ? [{ label: 'Stokta', remove: () => setExtra((e) => ({ ...e, inStock: false })) }] : []),
    ...(extra.sale ? [{ label: 'Kampanyalı', remove: () => setExtra((e) => ({ ...e, sale: false })) }] : []),
  ];

  const header = (
    <View style={{ marginBottom: 4 }}>
      <View style={s.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput ref={input} value={q} onChangeText={setQ} placeholder="Ürün veya marka ara" placeholderTextColor={colors.muted}
          style={s.input} returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" />
        {q ? <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Aramayı temizle"><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} keyboardShouldPersistTaps="handled">
        <Chip label="Tümü" active={!cat} onPress={() => choose(null)} />
        {cats.map((c) => <Chip key={c} label={c} icon={iconFor(c)} active={cat === c} onPress={() => choose(cat === c ? null : c)} />)}
      </ScrollView>
      <FilterBar count={count} sort={SORTS.find((o) => o.key === sort)!} chips={chips} onClear={clear}
        onFilter={() => setSheet('filter')} onSort={() => setSheet('sort')} />
      <Text style={s.count}>{loading ? 'Ürünler yükleniyor…' : `${list.length} ürün`}</Text>
    </View>
  );

  const empty = q && !count ? `"${q}" için sonuç bulunamadı.` : count ? (
    <View style={s.empty}>
      <Text style={s.emptyText}>Seçtiğiniz filtrelere uygun ürün bulunamadı.</Text>
      <Pressable onPress={clear} accessibilityRole="button" hitSlop={8}><Text style={s.emptyLink}>Filtreleri temizle</Text></Pressable>
    </View>
  ) : 'Bu kategoride ürün yok.';

  return (
    <View style={s.screen}>
      <AppBar title={cat ?? 'Kategoriler'} />
      <ProductGrid data={list} header={header} empty={empty} />
      <FilterSheet visible={sheet === 'filter'} onClose={() => setSheet(null)} options={options} sel={sel} extra={extra}
        onToggle={toggle} onExtra={(e) => setExtra((x) => ({ ...x, ...e }))} onClear={clear}
        results={list.length} priceRange={priceRange} selected={count} />
      <SortSheet visible={sheet === 'sort'} onClose={() => setSheet(null)} options={sorts} value={sort} onChange={setSort} />
    </View>
  );
}

const priceLabel = ({ min, max }: Extra) => {
  const f = (v: string) => Number(v).toLocaleString('tr-TR');
  return min && max ? `${f(min)}–${f(max)} ₺` : min ? `${f(min)} ₺ üzeri` : `${f(max)} ₺ altı`;
};

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
  empty: { padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyLink: { color: colors.accent, fontSize: 14.5, fontWeight: '700' },
});
