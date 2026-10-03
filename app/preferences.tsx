import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../src/theme';
import { api } from '../src/client';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ErrorBox } from '../src/components/Form';
import { getSavedPushToken, permissionState, registerPush, type PermissionState } from '../src/push';
import { useAuth } from '../src/store/auth';

type Prefs = { marketing: boolean; orders: boolean; email: boolean | null };

// İletişim tercihleri: bildirim izni (telefon), kampanya / sipariş bildirimleri ve (üyeyse) e-posta kampanya izni.
// Tercihler sitedeki Hesabım → İletişim Tercihleri ile aynıdır.
export default function Preferences() {
  const token = useAuth((st) => st.token);
  const user = useAuth((st) => st.user);
  const [perm, setPerm] = useState<PermissionState>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([permissionState(), getSavedPushToken()]);
    setPerm(p); setPushToken(t);
    api<Prefs>(`/api/app/prefs${t ? `?token=${encodeURIComponent(t)}` : ''}`, { token })
      .then(setPrefs).catch((e) => setError((e as Error).message));
  }, [token]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);
  // Ayarlardan dönünce izin durumu yenilenir
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') load(); });
    return () => sub.remove();
  }, [load]);

  const save = (patch: Partial<Prefs>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next); setError(null);
    api('/api/app/prefs', { body: { ...patch, token: pushToken ?? '' }, token })
      .catch((e) => { setPrefs(prefs); setError((e as Error).message); });
  };

  const enable = async () => {
    if (perm === 'denied') return Linking.openSettings();
    const t = await registerPush(token);
    if (t) setPushToken(t);
    load();
  };

  const pushOn = perm === 'granted';
  return (
    <View style={s.screen}>
      <ScreenHeader title="İletişim Tercihleri" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={s.lead}>Size hangi kanallardan ulaşabileceğimizi seçin. Sipariş ve üyelikle ilgili zorunlu bilgilendirmeler bu tercihlerden bağımsızdır.</Text>
        <ErrorBox text={error} />

        {/* telefonun bildirim izni */}
        {perm !== 'unsupported' && !pushOn && (
          <View style={s.permBox}>
            <Ionicons name="notifications-off-outline" size={22} color="#B45309" />
            <View style={{ flex: 1 }}>
              <Text style={s.permTitle}>Bildirimler kapalı</Text>
              <Text style={s.permText}>{perm === 'denied' ? 'Bildirim izni telefonunuzun ayarlarından kapatılmış.' : 'Kampanya ve sipariş bildirimlerini almak için izin verin.'}</Text>
              <Pressable onPress={enable} style={({ pressed }) => [s.permBtn, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                <Text style={s.permBtnText}>{perm === 'denied' ? 'Ayarları aç' : 'Bildirimlere izin ver'}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!prefs ? <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} /> : (
          <>
            <Text style={s.groupTitle}>Uygulama bildirimleri</Text>
            <View style={s.group}>
              <Toggle icon="megaphone-outline" title="Kampanya ve duyurular" text="İndirim, kampanya ve duyuru bildirimleri." value={prefs.marketing} onChange={(v) => save({ marketing: v })} disabled={!pushOn} />
              <Toggle icon="cube-outline" title="Sipariş durumu" text="Ödeme alındı, hazırlanıyor, kargoya verildi ve teslim edildi bildirimleri." value={prefs.orders} onChange={(v) => save({ orders: v })} disabled={!pushOn} />
            </View>
            {!user && <Text style={s.hint}>Sipariş bildirimleri için hesabınızla giriş yapın.</Text>}

            <Text style={s.groupTitle}>E-posta</Text>
            {user && prefs.email !== null ? (
              <View style={s.group}>
                <Toggle icon="mail-outline" title="Kampanya ve duyurular" text={`Kampanya, indirim ve yeni ürün e-postaları (${user.email}).`} value={prefs.email} onChange={(v) => save({ email: v })} />
              </View>
            ) : (
              <Pressable onPress={() => router.push('/login')} style={({ pressed }) => [s.group, s.loginRow, pressed && { opacity: 0.8 }]} accessibilityRole="button">
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text style={s.loginText}>E-posta tercihleri için giriş yapın</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Toggle({ icon, title, text, value, onChange, disabled }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; text: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <View style={[s.row, disabled && { opacity: 0.5 }]}>
      <Ionicons name={icon} size={20} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowText}>{text}</Text>
      </View>
      <Switch value={value && !disabled} onValueChange={onChange} disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#FFFFFF" accessibilityLabel={title} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  permBox: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', marginBottom: 8 },
  permTitle: { color: '#92400E', fontSize: 15, fontWeight: '800' },
  permText: { color: '#92400E', fontSize: 13, lineHeight: 19, marginTop: 2 },
  permBtn: { alignSelf: 'flex-start', marginTop: 10, height: 38, paddingHorizontal: 14, borderRadius: radius, backgroundColor: colors.primary, justifyContent: 'center' },
  permBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
  groupTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, marginLeft: 4 },
  group: { borderRadius: radius, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  rowText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  hint: { color: colors.muted, fontSize: 12.5, marginTop: 8, marginLeft: 4 },
  loginRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  loginText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
});
