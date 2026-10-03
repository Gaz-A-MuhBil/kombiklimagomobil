import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../../src/theme';
import { AppBar } from '../../src/components/AppBar';
import { ProductTile } from '../../src/components/ProductTile';
import { SectionHead } from '../../src/components/Section';
import { iconFor, orderCategories } from '../../src/categories';
import { loadSeason, plural, useSeason } from '../../src/useSeason';
import { call, openSite, whatsapp } from '../../src/links';
import { discount, onSale, useProducts } from '../../src/useProducts';
import { useSlides, type Banner } from '../../src/useSlides';
import type { Product } from '../../src/store/cart';

const PAD = 16;

export default function Home() {
  const { products } = useProducts();
  const slides = useSlides();
  const order = useSeason((st) => st.order);
  useEffect(loadSeason, []);
  // kategoriler mevsime göre: kışın Kombi, yazın Klima önde (admin → Mevsim Sıralaması)
  const cats = useMemo(() => orderCategories(products.map((p) => p.category), order), [products, order]);
  const deals = useMemo(() => products.filter(onSale).sort((a, b) => discount(b) - discount(a)).slice(0, 12), [products]);
  // mevsimin ilk kategorisi "Çok Satan…" (12 ürün), diğerleri 4'er ürünlük bölümler
  const byCat = (c: string, n: number) => products.filter((p) => p.category === c && p.price > 0 && p.inStock).sort((a, b) => discount(b) - discount(a)).slice(0, n);
  const [lead, ...others] = cats;
  const openCat = (c: string) => router.navigate({ pathname: '/categories', params: { c } });

  return (
    <View style={s.screen}>
      <AppBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* arama: dokununca kategoriler ekranında arama açılır */}
        <Pressable onPress={() => router.navigate({ pathname: '/categories', params: { ara: '1' } })} style={s.search} accessibilityRole="search">
          <Ionicons name="search" size={18} color={colors.muted} />
          <Text style={s.searchText}>Kombi, klima, marka ara…</Text>
        </Pressable>

        <Banners slides={slides} />

        <SectionHead title="Kategoriler" onMore={() => router.navigate('/categories')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
          {cats.map((c) => (
            <Pressable key={c} onPress={() => openCat(c)} style={({ pressed }) => [s.cat, pressed && { opacity: 0.7 }]} accessibilityRole="button">
              <View style={s.catIcon}><MaterialCommunityIcons name={iconFor(c)} size={30} color={colors.primary} /></View>
              <Text style={s.catText} numberOfLines={2}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={s.trust}>
          <Trust icon="shield-check-outline" title="İGDAŞ Yetkili" sub="Bayi · 7005140" />
          <Trust icon="tools" title="Proje & Montaj" sub="Keşif desteği" />
          <Trust icon="file-document-outline" title="Faturalı" sub="Garantili ürün" />
        </View>

        {deals.length > 0 && <Row title="Kampanyalı Ürünler" data={deals} onMore={() => router.navigate('/campaigns')} />}
        {lead && <Row title={`Çok Satan ${plural(lead)}`} data={byCat(lead, 12)} onMore={() => openCat(lead)} />}
        {others.slice(0, 2).map((c) => <Row key={c} title={`Öne Çıkan ${plural(c)}`} data={byCat(c, 4)} onMore={() => openCat(c)} />)}

        {/* keşif / servis çağrısı */}
        <LinearGradient colors={['#071A2E', colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
          <MaterialCommunityIcons name="fire" size={26} color={colors.accent} />
          <Text style={s.ctaTitle}>Doğalgaz projesi ve montaj için keşif talep edin</Text>
          <Text style={s.ctaText}>İGDAŞ yetkili ekibimiz projeden montaja kadar tüm süreci sizin için yürütür.</Text>
          <View style={s.ctaRow}>
            <Pressable onPress={call} style={({ pressed }) => [s.ctaBtn, s.ctaBtnLight, pressed && { opacity: 0.85 }]} accessibilityRole="button">
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={[s.ctaBtnText, { color: colors.primary }]}>Hemen Ara</Text>
            </Pressable>
            <Pressable onPress={() => whatsapp('Merhaba Kombi Klima GO, doğalgaz projesi ve montaj için keşif talep etmek istiyorum.')} style={({ pressed }) => [s.ctaBtn, s.ctaBtnWa, pressed && { opacity: 0.85 }]} accessibilityRole="button">
              <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
              <Text style={s.ctaBtnText}>WhatsApp</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {others.slice(2).map((c) => <Row key={c} title={`Öne Çıkan ${plural(c)}`} data={byCat(c, 4)} onMore={() => openCat(c)} />)}

      </ScrollView>
    </View>
  );
}

/* ---------- Banner kaydırıcı ---------- */
// admin'de seçilen hedef: kampanyalar, bir kategori ya da sitedeki bir sayfa
const openBanner = (t: string) => {
  if (!t) return;
  if (t === 'kampanyalar') return router.navigate('/campaigns');
  if (t.startsWith('kategori:')) return router.navigate({ pathname: '/categories', params: { c: t.slice(9) } });
  const urun = t.match(/^\/urun\/([^/?#]+)/);
  if (urun) return router.push({ pathname: '/product/[slug]', params: { slug: urun[1] } });
  openSite(t);
};

const FALLBACK: { id: string; eyebrow: string; title: string; text: string; icon: 'water-boiler' | 'air-conditioner' | 'heat-pump-outline'; to: Href }[] = [
  { id: 'f1', eyebrow: 'Kış hazırlığı', title: 'Yoğuşmalı kombilerde kampanya', text: 'Seçili markalarda indirimli fiyatlar', icon: 'water-boiler', to: '/campaigns' },
  { id: 'f2', eyebrow: 'Konfor', title: 'Inverter klimalar', text: 'Sessiz ve verimli iklimlendirme', icon: 'air-conditioner', to: { pathname: '/categories', params: { c: 'Klima' } } },
  { id: 'f3', eyebrow: 'Yeni nesil ısıtma', title: 'Isı pompası ile tasarruf', text: 'Keşif ve proje desteğiyle', icon: 'heat-pump-outline', to: { pathname: '/categories', params: { c: 'Isı Pompası' } } },
];

function Banners({ slides }: { slides: Banner[] }) {
  const { width } = useWindowDimensions();
  const w = width - PAD * 2;
  const h = Math.round(w * 0.5);
  const list = useRef<FlatList>(null);
  const [i, setI] = useState(0);
  const items = slides.length ? slides : FALLBACK;
  const n = items.length;
  const step = w + 10;
  // Sonsuz döngü: listenin sonuna ilk bannerın bir kopyası eklenir. Son bannerdan sonra kopyaya kayarak geçilir,
  // ardından fark edilmeden gerçek ilk bannera atlanır; böylece başa geri sarma görünmez.
  const loop = n > 1 ? [...items, { ...items[0], id: `${items[0].id}-kopya` }] : items;

  const toStart = () => { list.current?.scrollToOffset({ offset: 0, animated: false }); setI(0); };

  // 5 saniyede bir sonraki bannera geç (elle kaydırınca süre baştan başlar)
  useEffect(() => {
    if (n < 2) return;
    const t = setTimeout(() => {
      const next = i + 1;
      list.current?.scrollToOffset({ offset: next * step, animated: true });
      setI(next);
    }, 5000);
    return () => clearTimeout(t);
  }, [i, n, step]);

  // kopyaya varıldıysa kayma animasyonu bitince ilk bannera sessizce dön
  useEffect(() => {
    if (n < 2 || i !== n) return;
    const t = setTimeout(toStart, 450);
    return () => clearTimeout(t);
  }, [i, n]);

  return (
    <View style={{ marginTop: 14, marginBottom: 24 }}>
      <FlatList
        ref={list}
        data={loop as (Banner | (typeof FALLBACK)[number])[]}
        keyExtractor={(it) => it.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: PAD, gap: 10 }}
        onMomentumScrollEnd={(e) => {
          const k = Math.round(e.nativeEvent.contentOffset.x / step);
          if (n > 1 && k === n) toStart();
          else setI(k);
        }}
        renderItem={({ item }) => ('image' in item ? (
          <Pressable onPress={() => openBanner(item.target)} disabled={!item.target} style={[s.banner, { width: w, height: h }]}>
            <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            {(item.title || item.eyebrow) ? (
              <LinearGradient colors={['rgba(11,29,69,0.75)', 'rgba(11,29,69,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.bannerShade}>
                {item.eyebrow ? <Text style={s.eyebrow}>{item.eyebrow}</Text> : null}
                {item.title ? <Text style={s.bannerTitle} numberOfLines={2}>{item.title}</Text> : null}
                {item.text ? <Text style={s.bannerText} numberOfLines={1}>{item.text}</Text> : null}
              </LinearGradient>
            ) : null}
          </Pressable>
        ) : (
          <Pressable onPress={() => router.navigate(item.to)} style={[s.banner, { width: w, height: h }]}>
            <LinearGradient colors={['#071A2E', colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, s.fallback]}>
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>{item.eyebrow}</Text>
                <Text style={s.bannerTitle}>{item.title}</Text>
                <Text style={s.bannerText}>{item.text}</Text>
                <View style={s.bannerBtn}><Text style={s.bannerBtnText}>İncele</Text></View>
              </View>
              <MaterialCommunityIcons name={item.icon} size={Math.round(h * 0.5)} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
          </Pressable>
        ))}
      />
      {n > 1 && (
        <View style={s.dots}>
          {items.map((it, k) => <View key={it.id} style={[s.dot, k === i % n && s.dotOn]} />)}
        </View>
      )}
    </View>
  );
}

function Row({ title, data, onMore }: { title: string; data: Product[]; onMore: () => void }) {
  if (!data.length) return null;
  return (
    <View style={{ marginBottom: 28 }}>
      <SectionHead title={title} onMore={onMore} />
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, gap: 12 }}
        renderItem={({ item }) => <ProductTile product={item} width={156} />}
      />
    </View>
  );
}

function Trust({ icon, title, sub }: { icon: 'shield-check-outline' | 'tools' | 'file-document-outline'; title: string; sub: string }) {
  return (
    <View style={s.trustItem}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.accent} />
      <Text style={s.trustTitle}>{title}</Text>
      <Text style={s.trustSub}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: PAD, marginTop: 12, height: 46, paddingHorizontal: 14,
    borderRadius: radius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  searchText: { color: colors.muted, fontSize: 14.5 },
  banner: { borderRadius: radius, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  bannerShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 16, paddingRight: '35%' },
  fallback: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 8 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  bannerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', lineHeight: 24, marginTop: 4 },
  bannerText: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, marginTop: 4 },
  bannerBtn: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: radius, paddingHorizontal: 12, paddingVertical: 7, marginTop: 12 },
  bannerBtnText: { color: colors.primary, fontSize: 12.5, fontWeight: '800' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: radius, backgroundColor: colors.border },
  dotOn: { width: 18, backgroundColor: colors.primary },
  cats: { paddingHorizontal: PAD, gap: 12, paddingBottom: 4 },
  cat: { width: 76, alignItems: 'center' },
  catIcon: { width: 68, height: 68, borderRadius: radius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  catText: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6, lineHeight: 15 },
  trust: { flexDirection: 'row', marginHorizontal: PAD, marginTop: 22, marginBottom: 28, borderRadius: radius, backgroundColor: colors.surface, paddingVertical: 14 },
  trustItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  trustTitle: { color: colors.text, fontSize: 12.5, fontWeight: '800', marginTop: 6 },
  trustSub: { color: colors.muted, fontSize: 11, marginTop: 1 },
  cta: { marginHorizontal: PAD, marginBottom: 28, borderRadius: radius, padding: 20 },
  ctaTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', lineHeight: 24, marginTop: 10 },
  ctaText: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  ctaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: radius },
  ctaBtnLight: { backgroundColor: '#FFFFFF' },
  ctaBtnWa: { backgroundColor: colors.whatsapp },
  ctaBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
