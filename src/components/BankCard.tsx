import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { absolute } from '../api';

// Havale / EFT bilgileri (sitedeki ile aynı); IBAN dokununca kopyalanır
export const BANK = {
  name: 'Kuveyt Türk',
  holder: 'GAZA MÜHENDİSLİK İNŞAAT TAAHHÜT VE TİCARET LİMİTED ŞİRKETİ',
  iban: 'TR490020500009635656700001',
  logo: '/price/kuveytturk.svg',
};
export const PAYMENT_SOON = 'Kartla ödeme altyapısı hazırlanıyor, yakında hizmetinizde.';
const groups = (iban: string) => iban.replace(/(.{4})/g, '$1 ').trim();

export function BankCard() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(BANK.iban).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <View style={s.card}>
      <View style={s.head}>
        <Image source={absolute(BANK.logo)} style={s.logo} contentFit="contain" accessibilityLabel={BANK.name} />
        <Text style={s.tag}>HAVALE / EFT</Text>
      </View>
      <Text style={s.k}>Alıcı</Text>
      <Text style={s.holder}>{BANK.holder}</Text>
      <Text style={[s.k, { marginTop: 10 }]}>IBAN</Text>
      <Pressable onPress={copy} style={({ pressed }) => [s.ibanRow, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel="IBAN'ı kopyala">
        <Text style={s.iban} selectable>{groups(BANK.iban)}</Text>
        <View style={s.copy}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={colors.primary} />
          <Text style={s.copyText}>{copied ? 'Kopyalandı' : 'Kopyala'}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginTop: 16, padding: 14, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  logo: { width: 124, height: 22 },
  tag: { color: colors.muted, fontSize: 10.5, fontWeight: '700', letterSpacing: 1 },
  k: { color: colors.muted, fontSize: 12 },
  holder: { color: colors.text, fontSize: 13.5, fontWeight: '700', lineHeight: 19, marginTop: 1 },
  ibanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  iban: { flex: 1, color: colors.primary, fontSize: 13, fontWeight: '800' },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius, borderWidth: 1, borderColor: colors.border },
  copyText: { color: colors.primary, fontSize: 11.5, fontWeight: '700' },
});
