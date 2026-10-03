import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Button, ErrorBox, Field, link } from '../src/components/Form';
import { useAuth } from '../src/store/auth';

// Giriş: sitedeki hesapla aynı e-posta ve parola. ?next=/orders gibi bir hedefle açılabilir.
export default function Login() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pass = useRef<TextInput>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) return setError('E-posta ve parolanızı yazın.');
    setBusy(true);
    try {
      await login(email.trim(), password);
      if (next) router.replace(next as Href);
      else if (router.canGoBack()) router.back();
      else router.replace('/account');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="Giriş Yap" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Tekrar hoş geldiniz</Text>
          <Text style={s.sub}>Siparişlerinizi takip etmek için hesabınıza giriş yapın.</Text>
          <ErrorBox text={error} />
          <Field label="E-posta" value={email} onChangeText={setEmail} placeholder="ornek@eposta.com" keyboardType="email-address"
            autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => pass.current?.focus()} />
          <Field ref={pass} label="Parola" value={password} onChangeText={setPassword} secure placeholder="Parolanız"
            autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
          <Button label="Giriş Yap" onPress={submit} loading={busy} />
          <View style={s.switch}>
            <Text style={s.switchText}>Hesabınız yok mu? </Text>
            <Text style={link} onPress={() => router.replace({ pathname: '/register', params: next ? { next } : {} })}>Üye olun</Text>
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
  switch: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: colors.muted, fontSize: 14 },
});
