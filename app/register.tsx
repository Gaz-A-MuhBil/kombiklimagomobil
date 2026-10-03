import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Button, Check, ErrorBox, Field, link } from '../src/components/Form';
import { useAuth } from '../src/store/auth';

// Üyelik: sitedeki üyelikle aynı hesap; hoş geldiniz e-postası ve bülten onayı sitedeki gibi işler
export default function Register() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const register = useAuth((s) => s.register);
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [newsletter, setNewsletter] = useState(true);
  const [kvkk, setKvkk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = async () => {
    setError(null);
    if (!kvkk) return setError('Devam etmek için KVKK Aydınlatma Metni’ni onaylayın.');
    setBusy(true);
    try {
      await register({ ...f, email: f.email.trim(), kvkk, newsletter });
      if (next) router.replace(next as Href);
      else if (router.canGoBack()) router.back();
      else router.replace('/account');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const openPage = (slug: string) => router.push({ pathname: '/page/[slug]', params: { slug } });

  return (
    <View style={s.screen}>
      <ScreenHeader title="Üye Ol" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Hesap oluşturun</Text>
          <Text style={s.sub}>Siparişlerinizi takip edin, kampanyalardan ilk siz haberdar olun.</Text>
          <ErrorBox text={error} />
          <View style={s.row}>
            <View style={{ flex: 1 }}><Field label="Ad" value={f.firstName} onChangeText={set('firstName')} autoComplete="given-name" textContentType="givenName" /></View>
            <View style={{ flex: 1 }}><Field label="Soyad" value={f.lastName} onChangeText={set('lastName')} autoComplete="family-name" textContentType="familyName" /></View>
          </View>
          <Field label="E-posta" value={f.email} onChangeText={set('email')} placeholder="ornek@eposta.com" keyboardType="email-address"
            autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <Field label="Telefon" value={f.phone} onChangeText={set('phone')} placeholder="05xx xxx xx xx" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
          <Field label="Parola" value={f.password} onChangeText={set('password')} secure hint="En az 8 karakter" autoComplete="new-password" textContentType="newPassword" />

          <Check checked={newsletter} onChange={setNewsletter}>
            Kampanya, indirim ve yeniliklerden e-posta ile haberdar olmak için bültene abone olmak ve bu amaçla tarafıma ticari elektronik ileti gönderilmesini istiyorum. Aboneliğimi dilediğim zaman sonlandırabilirim.
          </Check>
          <Check checked={kvkk} onChange={setKvkk}>
            <Text style={link} onPress={() => openPage('kvkk-aydinlatma-metni')}>KVKK Aydınlatma Metni</Text>’ni okudum ve kabul ediyorum.
          </Check>

          <View style={{ marginTop: 8 }}><Button label="Üye Ol" onPress={submit} loading={busy} /></View>
          <View style={s.switch}>
            <Text style={s.switchText}>Zaten üye misiniz? </Text>
            <Text style={link} onPress={() => router.replace({ pathname: '/login', params: next ? { next } : {} })}>Giriş yapın</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 14.5, lineHeight: 21, marginTop: 6, marginBottom: 22 },
  row: { flexDirection: 'row', gap: 12 },
  switch: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: colors.muted, fontSize: 14 },
});
