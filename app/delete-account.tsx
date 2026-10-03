import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Check, ErrorBox, Field } from '../src/components/Form';
import { useAuth } from '../src/store/auth';
import { useFavorites } from '../src/store/favorites';

const MAIL = 'destek@kombiklimago.com';
const notify = (title: string, text: string) => (Platform.OS === 'web' ? window.alert(`${title}\n${text}`) : Alert.alert(title, text));

// Hesap silme (App Store / Google Play zorunluluğu): parola + onay ile hesap sunucuda kalıcı olarak silinir.
// Aynı işlem sitede /hesap-silme sayfasından da yapılabilir.
export default function DeleteAccount() {
  const user = useAuth((s) => s.user);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const [password, setPassword] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!password) return setError('Parolanızı girin.');
    if (!ok) return setError('Devam etmek için onay kutusunu işaretleyin.');
    const run = async () => {
      setBusy(true);
      try {
        await deleteAccount(password);
        useFavorites.setState({ ids: [] });
        if (router.canGoBack()) router.back(); else router.replace('/account');
        notify('Hesabınız silindi', 'Bizi tercih ettiğiniz için teşekkür ederiz.');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    };
    // Tarayıcı önizlemesinde Alert düğmeleri çalışmaz; orada tarayıcı onayı kullanılır
    if (Platform.OS === 'web') { if (window.confirm('Hesabınız silinecek. Bu işlem geri alınamaz. Devam edilsin mi?')) run(); return; }
    Alert.alert('Hesabınız silinecek', 'Bu işlem geri alınamaz. Devam edilsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Hesabımı sil', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="Hesabımı Sil" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={s.lead}>Web sitesi ve uygulama aynı hesabı kullanır. Hesabınızı sildiğinizde ikisinde de kullanılamaz hâle gelir.</Text>

          <View style={s.box}>
            <Text style={s.boxTitle}>Silinen veriler</Text>
            {['Üyelik bilgileriniz (ad, soyad, e-posta, telefon, parola)', 'Favorileriniz', 'Ürün yorumlarınız ve puanlarınız', 'Telefonunuzun hesabınızla bağlantısı (bildirimler)', 'E-posta kampanya izniniz'].map((t) => (
              <View key={t} style={s.li}><Ionicons name="close-circle" size={16} color="#B91C1C" style={{ marginTop: 1 }} /><Text style={s.liText}>{t}</Text></View>
            ))}
            <Text style={[s.boxTitle, { marginTop: 14 }]}>Saklanan veriler</Text>
            <Text style={s.liText}>Sipariş ve fatura kayıtları vergi ve ticaret mevzuatı gereği yasal saklama süresi (10 yıl) boyunca saklanır; hesabınızla bağlantısı kaldırılır.</Text>
          </View>

          {user ? (
            <View style={{ marginTop: 20 }}>
              <Text style={s.account}>Silinecek hesap: <Text style={{ fontWeight: '800' }}>{user.email}</Text></Text>
              <Field label="Parolanız" value={password} onChangeText={setPassword} secure autoComplete="current-password" textContentType="password" autoCapitalize="none" returnKeyType="done" />
              <Check checked={ok} onChange={setOk}>Hesabımın ve yukarıda belirtilen verilerimin kalıcı olarak silineceğini, bu işlemin geri alınamayacağını anladım.</Check>
              <ErrorBox text={error} />
              <Pressable onPress={submit} disabled={busy} accessibilityRole="button" style={({ pressed }) => [s.btn, (pressed || busy) && { opacity: 0.8 }]}>
                <Text style={s.btnText}>{busy ? 'Siliniyor…' : 'Hesabımı kalıcı olarak sil'}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[s.lead, { marginTop: 20 }]}>Hesabınızı silmek için önce giriş yapın.</Text>
          )}

          <Text style={s.mail}>
            Parolanızı hatırlamıyorsanız hesabınıza kayıtlı e-posta adresinden{' '}
            <Text style={s.mailLink} onPress={() => Linking.openURL(`mailto:${MAIL}?subject=Hesap%20silme%20talebi`)}>{MAIL}</Text>
            {' '}adresine yazarak da hesap silme talebinde bulunabilirsiniz.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  box: { marginTop: 16, padding: 14, borderRadius: radius, borderWidth: 1, borderColor: colors.border },
  boxTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  li: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  liText: { flex: 1, color: colors.muted, fontSize: 13.5, lineHeight: 20 },
  account: { color: colors.text, fontSize: 14, marginBottom: 14 },
  btn: { height: 50, borderRadius: radius, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '700' },
  mail: { color: colors.muted, fontSize: 12.5, lineHeight: 19, marginTop: 24 },
  mailLink: { color: colors.primary, fontWeight: '700' },
});
