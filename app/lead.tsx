import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../src/theme';
import { api } from '../src/client';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Button, Check, ErrorBox, Field, link } from '../src/components/Form';
import { useAuth } from '../src/store/auth';
import { tl } from '../src/data';
import { useProducts } from '../src/useProducts';

// Bilgi / teklif al: sitedeki "Bilgi Al" formuyla aynı yere düşer (admin → Bilgi Talepleri, e-posta ve WhatsApp bildirimi).
// ?urun=<slug>&ad=<ürün adı>&gorsel=<adres> ile belirli bir ürün için açılabilir; ürün görseli, markası ve fiyatı üstte gösterilir.
export default function Lead() {
  const { urun, ad, gorsel } = useLocalSearchParams<{ urun?: string; ad?: string; gorsel?: string }>();
  const { products } = useProducts();
  const product = useMemo(() => (urun ? products.find((x) => x.slug === urun) : undefined), [products, urun]);
  const image = gorsel || product?.imageUrl;
  const user = useAuth((s) => s.user);
  const [f, setF] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    city: '',
    message: '',
  });
  const [kvkk, setKvkk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = async () => {
    setError(null);
    if (!kvkk) return setError('Devam etmek için KVKK Aydınlatma Metni’ni onaylayın.');
    setBusy(true);
    try {
      await api('/api/app/lead', { body: { ...f, kvkk, product: urun ?? '' } });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View style={s.screen}>
        <ScreenHeader title="Bilgi / Teklif Al" />
        <View style={s.done}>
          <View style={s.doneIcon}><Ionicons name="checkmark" size={40} color="#FFFFFF" /></View>
          <Text style={s.doneTitle}>Talebiniz alındı</Text>
          <Text style={s.doneText}>En kısa sürede sizi arayacağız. Acil durumlar için bize telefon ya da WhatsApp üzerinden de ulaşabilirsiniz.</Text>
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}><Button label="Ana sayfaya dön" onPress={() => router.navigate('/')} /></View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScreenHeader title="Bilgi / Teklif Al" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {ad ? (
            <View style={s.product}>
              <View style={s.thumb}>
                {image ? <Image source={image} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
                  : <Ionicons name="cube-outline" size={26} color={colors.primary} />}
              </View>
              <View style={{ flex: 1 }}>
                {product?.brand ? <Text style={s.productBrand}>{product.brand}</Text> : null}
                <Text style={s.productText} numberOfLines={3}>{ad}</Text>
                {product && product.price > 0 ? <Text style={s.productPrice}>{tl(product.price)}</Text> : null}
              </View>
            </View>
          ) : (
            <Text style={s.sub}>Ürün, proje ya da montaj için bilgi ve teklif isteyin; uzman ekibimiz sizi arasın.</Text>
          )}
          <ErrorBox text={error} />
          <Field label="Ad Soyad" value={f.fullName} onChangeText={set('fullName')} autoComplete="name" textContentType="name" />
          <Field label="Telefon" value={f.phone} onChangeText={set('phone')} placeholder="05xx xxx xx xx" keyboardType="phone-pad" autoComplete="tel" />
          <Field label="E-posta (isteğe bağlı)" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Şehir / ilçe (isteğe bağlı)" value={f.city} onChangeText={set('city')} placeholder="Örn. Sancaktepe" />
          <Field label="Mesajınız (isteğe bağlı)" value={f.message} onChangeText={set('message')} multiline numberOfLines={4}
            placeholder="Örn. 3+1 daire için kombi ve radyatör teklifi" />
          <Check checked={kvkk} onChange={setKvkk}>
            <Text style={link} onPress={() => router.push({ pathname: '/page/[slug]', params: { slug: 'kvkk-aydinlatma-metni' } })}>KVKK Aydınlatma Metni</Text>’ni okudum; talebim için benimle iletişime geçilmesini kabul ediyorum.
          </Check>
          <View style={{ marginTop: 8 }}><Button label="Talebi gönder" onPress={submit} loading={busy} /></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  sub: { color: colors.muted, fontSize: 14.5, lineHeight: 21, marginBottom: 20 },
  product: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, borderRadius: radius, backgroundColor: colors.surface, marginBottom: 18 },
  thumb: { width: 76, height: 76, borderRadius: radius, overflow: 'hidden', backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  productBrand: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  productText: { color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 19, marginTop: 2 },
  productPrice: { color: colors.primary, fontSize: 14.5, fontWeight: '800', marginTop: 4 },
  done: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 72 },
  doneIcon: { width: 76, height: 76, borderRadius: radius, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  doneTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 20 },
  doneText: { color: colors.muted, fontSize: 14.5, lineHeight: 22, textAlign: 'center', marginTop: 8 },
});
