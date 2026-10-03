import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, radius } from '../../src/theme';
import { AppBar } from '../../src/components/AppBar';
import { SocialLinks } from '../../src/components/SocialLinks';
import { PHONE, call, whatsapp } from '../../src/links';
import { useCart } from '../../src/store/cart';
import { useFavorites } from '../../src/store/favorites';
import { useAuth } from '../../src/store/auth';

type Icon = keyof typeof Ionicons.glyphMap;
type Item = { icon: Icon; label: string; sub?: string; onPress: () => void };

// Hesabım: giriş/üyelik, siparişler, iletişim ve yasal metinler; hepsi uygulamanın kendi ekranlarında açılır
export default function Account() {
  const cartCount = useCart((s) => s.count());
  const favCount = useFavorites((s) => s.ids.length);
  const { user, orders, logout } = useAuth();
  const go = (href: Href) => router.push(href);
  const page = (slug: string) => go({ pathname: '/page/[slug]', params: { slug } });

  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Alışveriş',
      items: [
        { icon: 'receipt-outline', label: 'Siparişlerim', sub: user && orders.length ? `${orders.length} sipariş` : undefined, onPress: () => go('/orders') },
        { icon: 'bag-handle-outline', label: 'Sepetim', sub: cartCount ? `${cartCount} ürün` : undefined, onPress: () => router.navigate('/cart') },
        { icon: 'heart-outline', label: 'Favorilerim', sub: favCount ? `${favCount} ürün` : undefined, onPress: () => router.navigate('/favorites') },
      ],
    },
    {
      title: 'Ayarlar',
      items: [
        { icon: 'notifications-outline', label: 'İletişim tercihleri', sub: 'Bildirim ve e-posta izinleri', onPress: () => go('/preferences') },
        ...(user ? [{ icon: 'trash-outline' as Icon, label: 'Hesabımı sil', onPress: () => go('/delete-account') }] : []),
      ],
    },
    {
      title: 'Destek',
      items: [
        { icon: 'call-outline', label: 'Bizi arayın', sub: PHONE, onPress: call },
        { icon: 'logo-whatsapp', label: 'WhatsApp destek', onPress: () => whatsapp() },
        { icon: 'document-text-outline', label: 'Bilgi / teklif al', onPress: () => go('/lead') },
        { icon: 'location-outline', label: 'İletişim ve adres', onPress: () => go('/contact') },
      ],
    },
    {
      title: 'Kurumsal',
      items: [
        { icon: 'newspaper-outline', label: 'Blog', sub: 'Rehberler ve öneriler', onPress: () => go('/blog') },
        { icon: 'business-outline', label: 'Hakkımızda', onPress: () => page('hakkimizda') },
        { icon: 'swap-horizontal-outline', label: 'Teslimat ve iade', onPress: () => page('teslimat-ve-iade') },
        { icon: 'shield-checkmark-outline', label: 'KVKK aydınlatma metni', onPress: () => page('kvkk-aydinlatma-metni') },
        { icon: 'lock-closed-outline', label: 'Gizlilik politikası', onPress: () => page('gizlilik-politikasi') },
        { icon: 'reader-outline', label: 'Mesafeli satış sözleşmesi', onPress: () => page('mesafeli-satis-sozlesmesi') },
      ],
    },
  ];

  return (
    <View style={s.screen}>
      <AppBar title="Hesabım" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {user ? (
          <View style={s.welcome}>
            <View style={s.avatar}><Text style={s.initials}>{(user.firstName[0] ?? '') + (user.lastName[0] ?? '')}</Text></View>
            <Text style={s.hello}>{user.firstName} {user.lastName}</Text>
            <Text style={s.helloSub}>{user.email}{user.phone ? `
${user.phone}` : ''}</Text>
          </View>
        ) : (
          <View style={s.welcome}>
            <View style={s.avatar}><Ionicons name="person" size={28} color={colors.primary} /></View>
            <Text style={s.hello}>Hoş geldiniz</Text>
            <Text style={s.helloSub}>Siparişlerinizi takip etmek ve kampanyalardan haberdar olmak için giriş yapın.</Text>
            <View style={s.authRow}>
              <Pressable onPress={() => go('/login')} style={({ pressed }) => [s.btn, s.btnPrimary, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                <Text style={[s.btnText, { color: '#FFFFFF' }]}>Giriş Yap</Text>
              </Pressable>
              <Pressable onPress={() => go('/register')} style={({ pressed }) => [s.btn, s.btnGhost, pressed && { opacity: 0.7 }]} accessibilityRole="button">
                <Text style={s.btnText}>Üye Ol</Text>
              </Pressable>
            </View>
          </View>
        )}

        {groups.map((g) => (
          <View key={g.title} style={{ marginTop: 24 }}>
            <Text style={s.groupTitle}>{g.title}</Text>
            <View style={s.group}>
              {g.items.map((it, i) => (
                <Pressable key={it.label} onPress={it.onPress} accessibilityRole="button"
                  style={({ pressed }) => [s.row, i > 0 && s.rowBorder, pressed && { backgroundColor: colors.surface }]}>
                  <Ionicons name={it.icon} size={21} color={colors.primary} />
                  <Text style={s.rowLabel}>{it.label}</Text>
                  {it.sub ? <Text style={s.rowSub}>{it.sub}</Text> : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.border} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {user && (
          <Pressable onPress={() => Alert.alert('Çıkış yap', 'Hesabınızdan çıkış yapılsın mı?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Çıkış yap', style: 'destructive', onPress: logout }])}
            style={({ pressed }) => [s.logout, pressed && { backgroundColor: colors.surface }]} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
            <Text style={s.logoutText}>Çıkış yap</Text>
          </Pressable>
        )}

        <View style={s.footer}>
          <SocialLinks />
          <Text style={s.version}>Kombi Klima GO · Sürüm {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  welcome: { alignItems: 'center', padding: 20, borderRadius: radius, backgroundColor: colors.surface },
  avatar: { width: 60, height: 60, borderRadius: radius, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, height: 48, borderRadius: radius, borderWidth: 1, borderColor: colors.border },
  logoutText: { color: '#B91C1C', fontSize: 15, fontWeight: '700' },
  hello: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 12 },
  helloSub: { color: colors.muted, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  authRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignSelf: 'stretch' },
  btn: { flex: 1, height: 46, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  groupTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  group: { borderRadius: radius, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.bg },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15 },
  rowSub: { color: colors.muted, fontSize: 13 },
  footer: { alignItems: 'center', marginTop: 20 },
  version: { color: colors.muted, fontSize: 12, marginTop: 14 },
});
