import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../src/theme';
import { tl } from '../../src/data';
import { api } from '../../src/client';
import { AppBar } from '../../src/components/AppBar';
import { Check, link } from '../../src/components/Form';
import { BankCard, PAYMENT_SOON } from '../../src/components/BankCard';
import { whatsapp } from '../../src/links';
import { useCart } from '../../src/store/cart';

// Sunucudaki sepet hesabı (web sepetiyle aynı): kargo, kupon indirimi ve toplam
type Quote = {
  subtotal: number; discount: number; shipping: number; total: number; shippingNote: string; freeOver: number;
  coupon: { code: string; label: string } | null; couponError: string | null; problems: string[];
};

function useQuote() {
  const items = useCart((s) => s.items);
  const coupon = useCart((s) => s.coupon);
  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([items.map((i) => [i.id, i.qty]), coupon]);
  useEffect(() => {
    if (!items.length) return;
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      api<Quote>('/api/app/cart', { body: { items: items.map((i) => ({ id: Number(i.id), qty: i.qty })), coupon } })
        .then((r) => live && setQ(r))
        .catch(() => live && setQ(null))
        .finally(() => live && setLoading(false));
    }, 250);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { q, loading };
}

const openPage = (slug: string) => router.push({ pathname: '/page/[slug]', params: { slug } });

// Sepet: üst bardaki sepet simgesinden açılır. Sipariş şimdilik WhatsApp üzerinden iletilir.
export default function Cart() {
  const { items, remove, setQty, total, coupon, setCoupon } = useCart();
  const { q, loading } = useQuote();
  const [code, setCode] = useState('');
  const [terms, setTerms] = useState(false);
  const [warn, setWarn] = useState(false);
  const subtotal = q?.subtotal ?? total();
  const grand = q?.total ?? subtotal;
  const applied = coupon && q?.coupon;
  const couponError = coupon && q && !loading ? q.couponError : null;

  const order = () => {
    if (!terms) return setWarn(true);
    const lines = [
      'Merhaba Kombi Klima GO, uygulamadan sipariş vermek istiyorum:',
      '',
      ...items.map((i) => `• ${i.name} × ${i.qty} = ${tl(i.price * i.qty)}`),
      '',
      `Ara toplam: ${tl(subtotal)}`,
      `Kargo: ${q ? (q.shipping > 0 ? tl(q.shipping) : 'Ücretsiz') : '-'}`,
      ...(q?.coupon && q.discount > 0 ? [`İndirim (${q.coupon.code}): -${tl(q.discount)}`] : []),
      `Toplam: ${tl(grand)}`,
      '',
      'Ödemeyi havale / EFT ile yapacağım.',
      'Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi’ni okudum, kabul ediyorum.',
    ];
    whatsapp(lines.join('\n'));
  };

  const summary = (
    <View style={s.box}>
      <Text style={s.boxTitle}>Sipariş özeti</Text>
      <Row k={`Ürünler (${items.reduce((t, i) => t + i.qty, 0)})`} v={tl(subtotal)} />
      <Row k="Kargo" sub={q?.shippingNote} v={!q ? '…' : q.shipping > 0 ? tl(q.shipping) : 'Ücretsiz'} green={!!q && q.shipping === 0} />
      {q?.coupon && q.discount > 0 && <Row k={`İndirim (${q.coupon.code})`} v={`−${tl(q.discount)}`} green />}
      {q && q.freeOver > 0 && q.shipping > 0 && (
        <Text style={s.freeHint}><Text style={{ fontWeight: '800', color: colors.text }}>{tl(q.freeOver - (q.subtotal - q.discount))}</Text> daha ekleyin, kargo ücretsiz olsun.</Text>
      )}

      {/* İndirim kuponu */}
      {applied ? (
        <View style={s.applied}>
          <Ionicons name="pricetag" size={17} color="#15803D" />
          <Text style={s.appliedText} numberOfLines={1}><Text style={{ fontWeight: '800' }}>{q!.coupon!.code}</Text> · {q!.coupon!.label}</Text>
          <Pressable onPress={() => setCoupon(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kuponu kaldır">
            <Ionicons name="close" size={20} color="#166534" />
          </Pressable>
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Text style={s.label}>İndirim kuponu</Text>
          <View style={s.couponRow}>
            <TextInput value={code} onChangeText={(t) => setCode(t.toLocaleUpperCase('tr-TR'))} placeholder="Kupon kodunuz" placeholderTextColor={colors.muted}
              autoCapitalize="characters" autoCorrect={false} maxLength={40} returnKeyType="done" onSubmitEditing={() => code.trim() && setCoupon(code.trim())}
              style={s.couponInput} accessibilityLabel="İndirim kuponu" />
            <Pressable onPress={() => code.trim() && setCoupon(code.trim())} disabled={!code.trim()} accessibilityRole="button"
              style={({ pressed }) => [s.apply, (!code.trim() || pressed) && { opacity: 0.6 }]}>
              {coupon && loading ? <ActivityIndicator color={colors.primary} /> : <Text style={s.applyText}>Uygula</Text>}
            </Pressable>
          </View>
          {couponError ? <Text style={s.couponError}>{couponError}</Text> : null}
        </View>
      )}

      {/* Sözleşme onayı */}
      <View style={{ marginTop: 16 }}>
        <Check checked={terms} onChange={(v) => { setTerms(v); if (v) setWarn(false); }}>
          <Text style={link} onPress={() => openPage('on-bilgilendirme-formu')}>Ön Bilgilendirme Formu</Text>’nu ve{' '}
          <Text style={link} onPress={() => openPage('mesafeli-satis-sozlesmesi')}>Mesafeli Satış Sözleşmesi</Text>’ni okudum, kabul ediyorum.
        </Check>
        {warn && !terms ? <Text style={s.couponError}>Devam etmek için sözleşmeyi onaylayın.</Text> : null}
      </View>
      {q?.problems[0] ? <Text style={[s.couponError, { marginTop: 8 }]}>{q.problems[0]}</Text> : null}

      {/* Ödeme: WhatsApp'tan sipariş, havale / EFT ile ödeme */}
      <Text style={s.payTitle}>Ödeme</Text>
      <Text style={s.payText}>Siparişinizi WhatsApp ile iletin, ödemeyi aşağıdaki hesaba havale / EFT ile yapabilirsiniz.</Text>
      <BankCard />
      <Text style={s.soon}>{PAYMENT_SOON}</Text>
    </View>
  );

  return (
    <View style={s.screen}>
      <AppBar title="Sepetim" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: items.length ? 24 : 110, gap: 12 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}><Ionicons name="bag-handle-outline" size={34} color={colors.primary} /></View>
              <Text style={s.emptyTitle}>Sepetiniz boş</Text>
              <Text style={s.emptyText}>Ürünlerdeki sepet simgesine dokunarak ekleyebilirsiniz.</Text>
              <Pressable onPress={() => router.navigate('/categories')} style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                <Text style={s.btnText}>Alışverişe başla</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={items.length ? summary : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => item.slug && router.push({ pathname: '/product/[slug]', params: { slug: item.slug } })} style={s.item}>
              <View style={s.thumb}>
                {item.imageUrl ? <Image source={item.imageUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.brand}>{item.brand}</Text>
                <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                <View style={s.itemBottom}>
                  <View style={s.stepper}>
                    <Pressable onPress={() => setQty(item.id, item.qty - 1)} style={s.step} accessibilityLabel="Azalt"><Ionicons name="remove" size={16} color={colors.primary} /></Pressable>
                    <Text style={s.qty}>{item.qty}</Text>
                    <Pressable onPress={() => setQty(item.id, item.qty + 1)} style={s.step} accessibilityLabel="Arttır"><Ionicons name="add" size={16} color={colors.primary} /></Pressable>
                  </View>
                  <Text style={s.price}>{tl(item.price * item.qty)}</Text>
                </View>
              </View>
              <Pressable onPress={() => remove(item.id)} hitSlop={8} style={s.remove} accessibilityLabel="Sepetten çıkar">
                <Ionicons name="trash-outline" size={18} color={colors.muted} />
              </Pressable>
            </Pressable>
          )}
        />
        {items.length > 0 && (
          <View style={s.bar}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Toplam{q && q.discount > 0 ? <Text style={s.saved}>  {tl(q.discount)} indirim</Text> : null}</Text>
              <Text style={s.total}>{tl(grand)}</Text>
            </View>
            <Pressable onPress={order} style={({ pressed }) => [s.btn, s.orderBtn, (!terms || pressed) && { opacity: terms ? 0.85 : 0.55 }]} accessibilityRole="button"
              accessibilityState={{ disabled: !terms }}>
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={s.btnText}>WhatsApp ile sipariş ver</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function Row({ k, v, sub, green }: { k: string; v: string; sub?: string; green?: boolean }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowK, green && { color: '#15803D' }]}>{k}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <Text style={[s.rowV, green && { color: '#15803D' }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  item: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius, borderWidth: 1, borderColor: colors.border },
  thumb: { width: 76, height: 76, borderRadius: radius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 19, marginTop: 2, paddingRight: 20 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius },
  step: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center', color: colors.text, fontWeight: '700' },
  price: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  remove: { position: 'absolute', top: 10, right: 10 },
  box: { marginTop: 4, padding: 16, borderRadius: radius, backgroundColor: colors.surface },
  boxTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  rowK: { color: colors.muted, fontSize: 14 },
  rowSub: { color: colors.muted, fontSize: 11.5, marginTop: 1 },
  rowV: { color: colors.text, fontSize: 14, fontWeight: '700' },
  freeHint: { color: colors.muted, fontSize: 12.5, marginTop: 6, padding: 8, borderRadius: radius, backgroundColor: colors.bg },
  label: { color: colors.text, fontSize: 13.5, fontWeight: '700', marginBottom: 6 },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1, height: 44, paddingHorizontal: 12, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
    color: colors.text, fontSize: 14.5, fontWeight: '700', letterSpacing: 0.5,
  },
  apply: { height: 44, paddingHorizontal: 18, borderRadius: radius, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  couponError: { color: '#B91C1C', fontSize: 12.5, fontWeight: '600', marginTop: 6 },
  applied: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, borderRadius: radius, borderWidth: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  appliedText: { flex: 1, color: '#166534', fontSize: 14 },
  payTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 20 },
  payText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  soon: { color: colors.muted, fontSize: 11.5, marginTop: 10 },
  bar: { padding: 16, paddingBottom: 20, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { color: colors.muted, fontSize: 15 },
  saved: { color: '#15803D', fontSize: 12.5, fontWeight: '700' },
  total: { color: colors.text, fontSize: 22, fontWeight: '800' },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius, paddingHorizontal: 22, height: 48 },
  orderBtn: { backgroundColor: colors.whatsapp },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 72 },
  emptyIcon: { width: 72, height: 72, borderRadius: radius, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 18 },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 6, marginBottom: 20 },
});
