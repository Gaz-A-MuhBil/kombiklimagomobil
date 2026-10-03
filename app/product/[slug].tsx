import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors, radius } from '../../src/theme';
import { tl } from '../../src/data';
import { absolute } from '../../src/api';
import { api } from '../../src/client';
import { call } from '../../src/links';
import { Button, ErrorBox } from '../../src/components/Form';
import { ProductTile } from '../../src/components/ProductTile';
import { SectionHead } from '../../src/components/Section';
import { useAuth } from '../../src/store/auth';
import { useCart, type Product } from '../../src/store/cart';
import { useFavorites } from '../../src/store/favorites';
import { discount, useProducts } from '../../src/useProducts';

type Review = { id: number; rating: number; comment: string; author: string; date: string };
type Eligibility = 'guest' | 'already' | 'ok' | 'waiting' | 'not-purchased';
type Detail = {
  product: Product & { sku: string | null; description: string; specs: Record<string, string>; images: string[] };
  reviews: { list: Review[]; summary: { avg: number; count: number } };
  eligibility: Eligibility;
  related: Product[];
};

// Ürün detayı: galeri (dokununca tam ekran), fiyat, açıklama, teknik özellikler, değerlendirmeler, benzer ürünler.
// Altta sabit bar: fiyat + Sepete Ekle / Bilgi Al.
export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const { products } = useProducts();
  const token = useAuth((s) => s.token);
  const add = useCart((s) => s.add);
  const cartCount = useCart((s) => s.count());
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  // detay gelene kadar listedeki bilgiyle (ad, görsel, fiyat) hemen göster
  const cached = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  const load = useCallback(
    () => api<Detail>(`/api/app/product/${slug}`, { token }).then(setData).catch((e) => setError((e as Error).message)),
    [slug, token]
  );
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const p = data?.product ?? cached;
  const fav = useFavorites((s) => (p ? s.ids.includes(p.id) : false));
  const toggleFav = useFavorites((s) => s.toggle);

  if (!p) {
    return (
      <View style={[s.screen, { paddingTop: top }]}>
        <TopBar count={cartCount} />
        {error ? <View style={{ padding: 20 }}><ErrorBox text={error} /></View> : <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />}
      </View>
    );
  }

  const images = (data?.product.images.map((u) => absolute(u)!) ?? [p.imageUrl].filter((x): x is string => !!x));
  const off = discount(p);
  const priced = p.price > 0;
  const addToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    add({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, category: p.category, price: p.price, oldPrice: p.oldPrice, inStock: p.inStock, imageUrl: images[0] ?? null });
    setToast(true);
  };
  const askInfo = () => router.push({ pathname: '/lead', params: { urun: p.slug ?? '', ad: p.name, gorsel: images[0] ?? '' } });

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + bottom }} showsVerticalScrollIndicator={false}>
        <Gallery images={images} width={width} name={p.name} topInset={top} off={off} />

        <View style={s.body}>
          <Text style={s.eyebrow}>{p.category} · {p.brand}</Text>
          <Text style={s.name}>{p.name}</Text>
          <View style={s.metaRow}>
            {data && data.reviews.summary.count > 0 && (
              <View style={s.rating}>
                <Stars value={data.reviews.summary.avg} />
                <Text style={s.ratingText}>{data.reviews.summary.avg.toFixed(1)} ({data.reviews.summary.count})</Text>
              </View>
            )}
            {data?.product.sku ? <Text style={s.sku}>Ürün kodu: {data.product.sku}</Text> : null}
          </View>

          <View style={s.priceRow}>
            {priced ? (
              <>
                <Text style={s.price}>{tl(p.price)}</Text>
                {off > 0 && <Text style={s.old}>{tl(p.oldPrice!)}</Text>}
                {off > 0 && <View style={s.offBadge}><Text style={s.offText}>-%{off}</Text></View>}
              </>
            ) : <Text style={s.price}>Fiyat için arayın</Text>}
          </View>
          <View style={s.stock}>
            <View style={[s.stockDot, { backgroundColor: p.inStock ? '#16A34A' : '#DC2626' }]} />
            <Text style={[s.stockText, { color: p.inStock ? '#16A34A' : '#DC2626' }]}>{p.inStock ? 'Stokta var' : 'Stokta yok'}</Text>
          </View>

          <View style={s.perks}>
            <Perk icon="construct-outline" text="Kurulum ve montaj hizmeti" />
            <Perk icon="shield-checkmark-outline" text="İGDAŞ Yetkili Bayi · Yetki No 7005140" />
            <Perk icon="call-outline" text="Ürün danışmanlığı: 0533 194 49 52" onPress={call} />
          </View>

          {!data && !error && <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />}
          {error && !data && <View style={{ marginTop: 16 }}><ErrorBox text={error} /></View>}

          {data?.product.description ? (
            <Section title="Ürün Açıklaması"><Description text={data.product.description} /></Section>
          ) : null}

          {data && Object.keys(data.product.specs).length > 0 && (
            <Section title="Teknik Özellikler">
              <View style={s.specs}>
                {Object.entries(data.product.specs).map(([k, v], i) => (
                  <View key={k} style={[s.spec, i > 0 && s.specBorder]}>
                    <Text style={s.specK}>{k}</Text>
                    <Text style={s.specV}>{v}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {data && <Reviews data={data} slug={slug} onPosted={load} />}
        </View>

        {data && data.related.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <SectionHead title="Benzer Ürünler" />
            <FlatList
              data={data.related.map((r) => ({ ...r, imageUrl: absolute(r.imageUrl ?? null) }))}
              keyExtractor={(r) => r.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => <ProductTile product={item} width={156} />}
            />
          </View>
        )}
      </ScrollView>

      {/* üstte galerinin üzerinde duran butonlar */}
      <View style={[s.floatBar, { top: top + 6 }]} pointerEvents="box-none">
        <RoundBtn icon="chevron-back" label="Geri" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <RoundBtn icon={fav ? 'heart' : 'heart-outline'} color={fav ? '#E11D48' : colors.text} label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); toggleFav(p.id); }} />
          <RoundBtn icon="bag-handle-outline" label="Sepet" badge={cartCount} onPress={() => router.navigate('/cart')} />
        </View>
      </View>

      {toast && (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(200)} style={[s.toast, { bottom: 84 + bottom }]}>
          <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
          <Text style={s.toastText}>Sepete eklendi</Text>
          <Pressable onPress={() => router.navigate('/cart')} hitSlop={8}><Text style={s.toastLink}>Sepete git</Text></Pressable>
        </Animated.View>
      )}

      <View style={[s.bottomBar, { paddingBottom: bottom + 10 }]}>
        {priced && p.inStock ? (
          <>
            <View style={{ flex: 1 }}><Button label="Bilgi Al" variant="ghost" icon="information-circle-outline" onPress={askInfo} /></View>
            <View style={{ flex: 1.4 }}><Button label="Sepete Ekle" icon="bag-add-outline" onPress={addToCart} /></View>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}><Button label="Ara" variant="ghost" icon="call-outline" onPress={call} /></View>
            <View style={{ flex: 1.4 }}><Button label="Bilgi Al" icon="information-circle-outline" onPress={askInfo} /></View>
          </>
        )}
      </View>
    </View>
  );
}

/* ---------- Galeri ---------- */
function Gallery({ images, width, name, topInset, off }: { images: string[]; width: number; name: string; topInset: number; off: number }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const list = useRef<FlatList>(null);
  return (
    <View style={{ width, height: width + topInset, paddingTop: topInset, backgroundColor: '#FFFFFF' }}>
      {images.length ? (
        <FlatList
          ref={list}
          data={images}
          keyExtractor={(u, k) => `${k}-${u}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Pressable onPress={() => setFull(true)} accessibilityLabel="Görseli büyüt">
              <Image source={item} style={{ width, height: width }} contentFit="contain" transition={200} accessibilityLabel={name} />
            </Pressable>
          )}
        />
      ) : <View style={s.noImg}><Ionicons name="image-outline" size={40} color={colors.border} /></View>}
      {off > 0 && <View style={[s.galleryBadge, { top: topInset + 64 }]}><Text style={s.galleryBadgeText}>%{off} indirim</Text></View>}
      {images.length > 1 && (
        <View style={s.galleryDots}>
          {images.map((_, k) => <View key={k} style={[s.gDot, k === i && s.gDotOn]} />)}
        </View>
      )}
      <Lightbox open={full} images={images} start={i} onClose={(k) => { setFull(false); setI(k); list.current?.scrollToOffset({ offset: k * width, animated: false }); }} />
    </View>
  );
}

function Lightbox({ open, images, start, onClose }: { open: boolean; images: string[]; start: number; onClose: (i: number) => void }) {
  const { width, height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [i, setI] = useState(start);
  return (
    <Modal visible={open} animationType="fade" onRequestClose={() => onClose(i)} statusBarTranslucent onShow={() => setI(start)}>
      <View style={{ flex: 1, backgroundColor: '#071A2E' }}>
        <FlatList
          data={images}
          keyExtractor={(u, k) => `${k}-${u}`}
          horizontal
          pagingEnabled
          initialScrollIndex={start}
          getItemLayout={(_, k) => ({ length: width, offset: width * k, index: k })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => <Image source={item} style={{ width, height }} contentFit="contain" />}
        />
        <View style={[s.lbTop, { top: top + 8 }]}>
          <Text style={s.lbCount}>{images.length > 1 ? `${i + 1} / ${images.length}` : ''}</Text>
          <Pressable onPress={() => onClose(i)} accessibilityLabel="Kapat" hitSlop={8} style={s.lbClose}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={{ height: bottom }} />
      </View>
    </Modal>
  );
}

/* ---------- Değerlendirmeler ---------- */
function Reviews({ data, slug, onPosted }: { data: Detail; slug: string; onPosted: () => void }) {
  const { list, summary } = data.reviews;
  const token = useAuth((s) => s.token);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    if (!rating) return setError('Lütfen puan verin.');
    setBusy(true);
    try {
      await api('/api/app/review', { token, body: { productId: data.product.id, rating: String(rating), comment } });
      setDone(true);
      onPosted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const note: Partial<Record<Eligibility, string>> = {
    'not-purchased': 'Bu ürünü değerlendirebilmek için satın almış olmanız gerekir.',
    waiting: 'Siparişiniz teslim edildikten sonra bu ürünü değerlendirebilirsiniz.',
    already: 'Bu ürünü zaten değerlendirdiniz, teşekkürler.',
  };

  return (
    <Section title="Değerlendirmeler" right={summary.count > 0 ? `${summary.avg.toFixed(1)} · ${summary.count} değerlendirme` : undefined}>
      {list.length ? list.slice(0, 20).map((r) => (
        <View key={r.id} style={s.review}>
          <View style={s.reviewHead}>
            <Stars value={r.rating} />
            <Text style={s.reviewAuthor}>{r.author}</Text>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
            <Text style={s.reviewBought}>Satın aldı</Text>
          </View>
          <Text style={s.reviewDate}>{r.date}</Text>
          <Text style={s.reviewText}>{r.comment}</Text>
        </View>
      )) : <Text style={s.muted}>Bu ürün için henüz değerlendirme yok.</Text>}

      {done ? (
        <Text style={[s.note, { color: '#16A34A' }]}>Yorumunuz için teşekkürler, yayınlandı.</Text>
      ) : data.eligibility === 'ok' ? (
        <View style={s.form}>
          <Text style={s.formTitle}>Ürünü değerlendirin</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={4} accessibilityLabel={`${n} yıldız`}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={30} color="#F59E0B" />
              </Pressable>
            ))}
          </View>
          <TextInput value={comment} onChangeText={setComment} multiline placeholder="Ürünle ilgili deneyiminizi yazın (en az 10 karakter)"
            placeholderTextColor={colors.muted} style={s.textarea} maxLength={1000} />
          <ErrorBox text={error} />
          <Button label="Yorumu gönder" onPress={submit} loading={busy} />
        </View>
      ) : data.eligibility === 'guest' ? (
        <Text style={s.note}>
          Ürünleri değerlendirmek için{' '}
          <Text style={s.noteLink} onPress={() => router.push({ pathname: '/login', params: { next: `/product/${slug}` } })}>giriş yapın</Text>.
          Yalnızca satın alan müşteriler yorum yapabilir.
        </Text>
      ) : <Text style={s.note}>{note[data.eligibility]}</Text>}
    </Section>
  );
}

/* ---------- Açıklama (sitedeki biçimle aynı kurallar) ---------- */
// Boş satırla ayrılmış bloklar; "• " ile başlayan satırlar liste, listeden önceki kısa satır alt başlık,
// "Kurulum: ..." gibi etiketli paragraflarda etiket kalın.
function Description({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((b) => b.length);
  return (
    <View style={{ gap: 12 }}>
      {blocks.map((lines, i) => {
        const bullets = lines.filter((l) => l.startsWith('• '));
        if (bullets.length) {
          const head = lines.find((l) => !l.startsWith('• '));
          return (
            <View key={i}>
              {head ? <Text style={s.descHead}>{head}</Text> : null}
              {bullets.map((b) => (
                <View key={b} style={s.bulletRow}><View style={s.bullet} /><Text style={s.desc}>{b.slice(2)}</Text></View>
              ))}
            </View>
          );
        }
        const para = lines.join(' ');
        const m = para.match(/^([A-ZÇĞİÖŞÜ][\wçğıöşüÇĞİÖŞÜ ]{2,30}):\s(.+)$/);
        return m
          ? <Text key={i} style={s.desc}><Text style={{ fontWeight: '800', color: colors.text }}>{m[1]}:</Text> {m[2]}</Text>
          : <Text key={i} style={s.desc}>{para}</Text>;
      })}
    </View>
  );
}

/* ---------- Küçük parçalar ---------- */
function TopBar({ count }: { count: number }) {
  return (
    <View style={[s.floatBar, { position: 'relative', top: 6 }]}>
      <RoundBtn icon="chevron-back" label="Geri" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} />
      <RoundBtn icon="bag-handle-outline" label="Sepet" badge={count} onPress={() => router.navigate('/cart')} />
    </View>
  );
}

function RoundBtn({ icon, label, onPress, badge, color = colors.text }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; badge?: number; color?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.round, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icon} size={22} color={color} />
      {badge ? <View style={s.badge}><Text style={s.badgeText}>{badge > 99 ? '99+' : badge}</Text></View> : null}
    </Pressable>
  );
}

function Section({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {right ? <Text style={s.sectionRight}>{right}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Perk({ icon, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={s.perk}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={[s.perkText, onPress && { color: colors.primary, fontWeight: '700' }]}>{text}</Text>
    </Pressable>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={value >= n ? 'star' : value >= n - 0.5 ? 'star-half' : 'star-outline'} size={size} color="#F59E0B" />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  noImg: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  galleryBadge: { position: 'absolute', left: 16, backgroundColor: '#E11D48', borderRadius: radius, paddingHorizontal: 8, paddingVertical: 4 },
  galleryBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  galleryDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  gDot: { width: 6, height: 6, borderRadius: radius, backgroundColor: 'rgba(15,23,42,0.2)' },
  gDotOn: { width: 18, backgroundColor: colors.primary },
  floatBar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  round: {
    width: 42, height: 42, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  badge: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  eyebrow: { color: colors.accent, fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  name: { color: colors.text, fontSize: 21, fontWeight: '700', lineHeight: 28, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  sku: { color: colors.muted, fontSize: 12.5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  price: { color: colors.primary, fontSize: 27, fontWeight: '800' },
  old: { color: colors.muted, fontSize: 15, textDecorationLine: 'line-through' },
  offBadge: { backgroundColor: '#FFE4E6', borderRadius: radius, paddingHorizontal: 7, paddingVertical: 3 },
  offText: { color: '#E11D48', fontSize: 12, fontWeight: '800' },
  stock: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  stockDot: { width: 7, height: 7, borderRadius: radius },
  stockText: { fontSize: 13, fontWeight: '700' },
  perks: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { flex: 1, color: '#334155', fontSize: 13.5 },
  section: { marginTop: 26 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sectionRight: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  desc: { flex: 1, color: '#334155', fontSize: 14.5, lineHeight: 22 },
  descHead: { color: colors.text, fontSize: 14.5, fontWeight: '800', marginBottom: 6 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 8 },
  specs: { borderRadius: radius, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  spec: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  specBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  specK: { flex: 1, color: colors.muted, fontSize: 13.5 },
  specV: { flex: 1, color: colors.text, fontSize: 13.5, fontWeight: '700' },
  review: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewAuthor: { color: colors.text, fontSize: 13.5, fontWeight: '800', marginLeft: 4 },
  reviewBought: { color: '#16A34A', fontSize: 12, fontWeight: '700' },
  reviewDate: { color: colors.muted, fontSize: 12, marginTop: 2 },
  reviewText: { color: '#334155', fontSize: 14, lineHeight: 21, marginTop: 6 },
  muted: { color: colors.muted, fontSize: 14, paddingVertical: 12 },
  note: { color: colors.muted, fontSize: 13.5, lineHeight: 20, padding: 14, borderRadius: radius, backgroundColor: colors.surface, marginTop: 12 },
  noteLink: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  form: { marginTop: 14, padding: 14, borderRadius: radius, backgroundColor: colors.surface },
  formTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  textarea: {
    minHeight: 96, textAlignVertical: 'top', padding: 12, borderRadius: radius, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bg, color: colors.text, fontSize: 14.5, marginBottom: 12,
  },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  toast: {
    position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: radius, backgroundColor: '#071A2E',
  },
  toastText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  toastLink: { color: '#FFA36E', fontSize: 14, fontWeight: '800' },
  lbTop: { position: 'absolute', left: 16, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lbCount: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  lbClose: { width: 44, height: 44, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
});
