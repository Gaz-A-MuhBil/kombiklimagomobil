import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius } from '../../src/theme';
import { api } from '../../src/client';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Button, ErrorBox } from '../../src/components/Form';

type Block = { t: 'h2' | 'h3' | 'p'; text: string } | { t: 'li'; text: string; n?: number } | { t: 'row'; k: string; v: string };
type Page = { title: string; updated: string; blocks: Block[] };

// Kurumsal ve yasal sayfalar (Hakkımızda, KVKK, sözleşmeler…): metin sitedekiyle aynıdır, uygulamanın tasarımıyla çizilir
const TITLES: Record<string, string> = {
  hakkimizda: 'Hakkımızda', 'teslimat-ve-iade': 'Teslimat ve İade', 'iptal-ve-iade-kosullari': 'İptal ve İade Koşulları',
  'kvkk-aydinlatma-metni': 'KVKK Aydınlatma Metni', 'gizlilik-politikasi': 'Gizlilik Politikası',
  'mesafeli-satis-sozlesmesi': 'Mesafeli Satış Sözleşmesi', 'on-bilgilendirme-formu': 'Ön Bilgilendirme Formu',
  'cerez-politikasi': 'Çerez Politikası', 'kullanim-kosullari': 'Kullanım Koşulları',
};

export default function LegalPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(() => api<Page>(`/api/app/page/${slug}`).then(setPage).catch((e) => setError((e as Error).message)), [slug]);
  useEffect(() => { fetchPage(); }, [fetchPage]);
  const load = () => { setError(null); fetchPage(); };

  return (
    <View style={s.screen}>
      <ScreenHeader title={page?.title ?? TITLES[slug] ?? ''} />
      {error ? (
        <View style={{ padding: 20 }}><ErrorBox text={error} /><Button label="Tekrar dene" variant="ghost" onPress={load} /></View>
      ) : !page ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          {page.blocks.map((b, i) => <BlockView key={i} b={b} prev={page.blocks[i - 1]} />)}
          <Text style={s.updated}>Son güncelleme: {page.updated}</Text>
        </ScrollView>
      )}
    </View>
  );
}

function BlockView({ b, prev }: { b: Block; prev?: Block }) {
  switch (b.t) {
    case 'h2': return <Text style={s.h2}>{b.text}</Text>;
    case 'h3': return <Text style={s.h3}>{b.text}</Text>;
    case 'p': return <Text style={s.p}>{b.text}</Text>;
    case 'li':
      return (
        <View style={s.li}>
          <Text style={s.bullet}>{b.n ? `${b.n}.` : '•'}</Text>
          <Text style={s.liText}>{b.text}</Text>
        </View>
      );
    case 'row':
      return (
        <View style={[s.row, prev?.t !== 'row' && s.rowFirst]}>
          <Text style={s.rowK}>{b.k}</Text>
          <Text style={s.rowV}>{b.v}</Text>
        </View>
      );
  }
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 48 },
  h2: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 22, marginBottom: 8, lineHeight: 24 },
  h3: { color: colors.text, fontSize: 15.5, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  p: { color: '#334155', fontSize: 15, lineHeight: 23, marginBottom: 10 },
  li: { flexDirection: 'row', gap: 8, marginBottom: 7, paddingLeft: 4 },
  bullet: { color: colors.accent, fontSize: 15, lineHeight: 23, fontWeight: '800', minWidth: 14 },
  liText: { flex: 1, color: '#334155', fontSize: 15, lineHeight: 23 },
  row: { paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderTopWidth: 0, borderColor: colors.border, backgroundColor: colors.bg },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: radius, borderTopRightRadius: radius, marginTop: 4 },
  rowK: { color: colors.muted, fontSize: 12.5, fontWeight: '700' },
  rowV: { color: colors.text, fontSize: 14.5, lineHeight: 20, marginTop: 2 },
  updated: { color: colors.muted, fontSize: 12.5, marginTop: 24 },
});
