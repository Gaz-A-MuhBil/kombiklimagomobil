import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../src/theme';
import { api } from '../src/client';
import { PHONE, call, whatsapp } from '../src/links';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Button, Check, ErrorBox, Field, link } from '../src/components/Form';
import { MapEmbed } from '../src/components/MapEmbed';
import { useAuth } from '../src/store/auth';

const TOPICS = ['Genel bilgi', 'Fiyat / teklif', 'Kurulum / montaj', 'Servis / bakım', 'Sipariş'];

type Info = {
  contact: { phone: string; email: string; address: string };
  company: { title: string; taxOffice: string; taxNo: string; mersis: string; tradeRegistryNo: string; registry: string; kep?: string };
  igdas: { title: string; no: string };
};

// İletişim: bilgiler sitedeki kayıtlardan gelir; gelmezse telefon numarası yine gösterilir.
// Form sitedeki İletişim/Bilgi Al formuyla aynı yere düşer: admin → Bilgi Talepleri, e-posta ve otomatik WhatsApp bildirimi.
export default function Contact() {
  const [info, setInfo] = useState<Info | null>(null);
  const user = useAuth((st) => st.user);
  const [f, setF] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    message: '',
  });
  const [topic, setTopic] = useState(TOPICS[0]);
  const [kvkk, setKvkk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = async () => {
    setError(null);
    if (f.message.trim().length < 5) return setError('Mesajınızı yazın.');
    if (!kvkk) return setError('Devam etmek için KVKK Aydınlatma Metni’ni onaylayın.');
    setBusy(true);
    try {
      await api('/api/app/lead', { body: { ...f, message: `[İletişim formu · ${topic}] ${f.message.trim()}`, kvkk } });
      setSent(true);
      setF({ ...f, message: '' });
      setKvkk(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { api<Info>('/api/app/info').then(setInfo).catch(() => {}); }, []);

  const c = info?.contact;
  const maps = () => {
    if (!c) return;
    const q = encodeURIComponent(c.address);
    Linking.openURL(Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="İletişim" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={s.grid}>
          <Action icon="call" label="Ara" sub={c?.phone ?? PHONE} onPress={call} />
          <Action icon="logo-whatsapp" label="WhatsApp" sub="Hemen yazın" color={colors.whatsapp} onPress={() => whatsapp()} />
        </View>
        <View style={s.group}>
          <Row icon="mail-outline" label="E-posta" value={c?.email} onPress={() => c && Linking.openURL(`mailto:${c.email}`)} />
          <Row icon="location-outline" label="Adres" value={c?.address} onPress={maps} />
          {info && <Row icon="shield-checkmark-outline" label={info.igdas.title} value={`Yetki no: ${info.igdas.no}`} />}
        </View>

        {c && (
          <>
            <Text style={s.groupTitle}>Konum</Text>
            <MapEmbed address={c.address} />
            <Pressable onPress={maps} style={({ pressed }) => [s.route, pressed && { opacity: 0.85 }]} accessibilityRole="button">
              <Text style={s.routeText}>Yol tarifi al</Text>
            </Pressable>
          </>
        )}

        <Text style={s.groupTitle}>Bize yazın</Text>
        {sent ? (
          <View style={s.sent} accessibilityRole="alert">
            <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
            <Text style={s.sentTitle}>Mesajınız bize ulaştı</Text>
            <Text style={s.sentText}>Teşekkür ederiz. Ekibimiz en kısa sürede size dönüş yapacak.</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 16 }}><Button label="Yeni mesaj yaz" variant="ghost" onPress={() => setSent(false)} /></View>
          </View>
        ) : (
          <View style={s.form}>
            <Text style={s.formLabel}>Konu</Text>
            <View style={s.topics}>
              {TOPICS.map((t) => (
                <Pressable key={t} onPress={() => setTopic(t)} style={[s.topic, topic === t && s.topicOn]} accessibilityRole="radio" accessibilityState={{ selected: topic === t }}>
                  <Text style={[s.topicText, topic === t && { color: '#FFFFFF' }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <ErrorBox text={error} />
            <Field label="Ad Soyad" value={f.fullName} onChangeText={set('fullName')} autoComplete="name" textContentType="name" />
            <Field label="Telefon" value={f.phone} onChangeText={set('phone')} placeholder="05xx xxx xx xx" keyboardType="phone-pad" autoComplete="tel" />
            <Field label="E-posta (isteğe bağlı)" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Field label="Mesajınız" value={f.message} onChangeText={set('message')} multiline numberOfLines={5} placeholder="Size nasıl yardımcı olabiliriz?" />
            <Check checked={kvkk} onChange={setKvkk}>
              <Text style={link} onPress={() => router.push({ pathname: '/page/[slug]', params: { slug: 'kvkk-aydinlatma-metni' } })}>KVKK Aydınlatma Metni</Text>’ni okudum; mesajım için benimle iletişime geçilmesini kabul ediyorum.
            </Check>
            <View style={{ marginTop: 8 }}><Button label="Mesajı gönder" onPress={submit} loading={busy} /></View>
          </View>
        )}

        {info && (
          <>
            <Text style={s.groupTitle}>Firma bilgileri</Text>
            <View style={s.group}>
              <InfoRow k="Ticaret unvanı" v={info.company.title} />
              <InfoRow k="Vergi dairesi / No" v={`${info.company.taxOffice} / ${info.company.taxNo}`} />
              <InfoRow k="MERSİS No" v={info.company.mersis} />
              {info.company.kep ? <InfoRow k="KEP adresi" v={info.company.kep} /> : null}
              <InfoRow k="Ticaret sicil" v={`${info.company.registry} – ${info.company.tradeRegistryNo}`} />
            </View>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Action({ icon, label, sub, color = colors.primary, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; color?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.action, pressed && { opacity: 0.85 }]}>
      <View style={[s.actionIcon, { backgroundColor: color }]}><Ionicons name={icon} size={22} color="#FFFFFF" /></View>
      <Text style={s.actionLabel}>{label}</Text>
      <Text style={s.actionSub}>{sub}</Text>
    </Pressable>
  );
}

function Row({ icon, label, value, action, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; action?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={21} color={colors.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value ?? '…'}</Text>
        {action ? <Text style={s.rowAction}>{action}</Text> : null}
      </View>
    </Pressable>
  );
}

const InfoRow = ({ k, v }: { k: string; v: string }) => (
  <View style={s.info}><Text style={s.infoK}>{k}</Text><Text style={s.infoV}>{v}</Text></View>
);

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  action: { flex: 1, padding: 16, borderRadius: radius, backgroundColor: colors.surface, alignItems: 'flex-start' },
  actionIcon: { width: 44, height: 44, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 },
  actionSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  group: { borderRadius: radius, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  groupTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row', gap: 12, padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowLabel: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  rowValue: { color: colors.text, fontSize: 15, lineHeight: 21, marginTop: 2 },
  rowAction: { color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 6 },
  route: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: 44, marginTop: 10, borderRadius: radius, borderWidth: 1.5, borderColor: colors.primary },
  routeText: { color: colors.primary, fontSize: 14.5, fontWeight: '800' },
  form: { padding: 16, borderRadius: radius, borderWidth: 1, borderColor: colors.border },
  formLabel: { color: colors.text, fontSize: 13.5, fontWeight: '700', marginBottom: 8 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  topic: { height: 34, paddingHorizontal: 12, borderRadius: radius, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  topicOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  topicText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  sent: { alignItems: 'center', padding: 24, borderRadius: radius, backgroundColor: colors.surface },
  sentTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 10 },
  sentText: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 4 },
  info: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  infoK: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  infoV: { color: colors.text, fontSize: 14.5, lineHeight: 20, marginTop: 2 },
});
