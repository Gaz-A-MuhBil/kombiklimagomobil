import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { absolute } from '../api';
import { openSite } from '../links';

// Sitedeki blog bloklarının uygulama içi çizimi (web: components/BlogContent)
export type BlogBlock =
  | { t: 'h2' | 'h3'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'img'; url: string; caption: string }
  | { t: 'table'; head: boolean; rows: string[][] }
  | { t: 'quote'; text: string; by: string }
  | { t: 'note'; tone: 'info' | 'tip' | 'warn'; title: string; text: string }
  | { t: 'hr' };

const TONE = {
  info: { icon: 'information-circle' as const, fg: colors.accent, bg: '#FDF1EA', border: '#F6CDB5', label: 'Bilgi' },
  tip: { icon: 'bulb' as const, fg: '#047857', bg: '#ECFDF5', border: '#A7F3D0', label: 'İpucu' },
  warn: { icon: 'warning' as const, fg: '#B45309', bg: '#FFFBEB', border: '#FCD34D', label: 'Dikkat' },
};

// Bağlantı: /urun/... ve /blog/... uygulama içinde, diğerleri uygulama içi tarayıcıda açılır
const openLink = (href: string) => {
  const urun = href.match(/^\/urun\/([^/?#]+)/);
  if (urun) return router.push({ pathname: '/product/[slug]', params: { slug: urun[1] } });
  const blog = href.match(/^\/blog\/([^/?#]+)/);
  if (blog) return router.push({ pathname: '/blog/[slug]', params: { slug: blog[1] } });
  openSite(href);
};

// **kalın** ve [metin](adres) biçimini çözer
function Inline({ text, style }: { text: string; style?: object }) {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:\/(?!\/)|https?:\/\/)[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const href = m[3];
    parts.push(m[1]
      ? <Text key={k++} style={s.bold}>{m[1]}</Text>
      : <Text key={k++} style={s.link} onPress={() => openLink(href)}>{m[2]}</Text>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Text style={style}>{parts}</Text>;
}

export function BlogBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return <View>{blocks.map((b, i) => <Block key={i} b={b} prev={blocks[i - 1]} />)}</View>;
}

function Block({ b, prev }: { b: BlogBlock; prev?: BlogBlock }) {
  const afterHeading = prev?.t === 'h2' || prev?.t === 'h3';
  const gap = { marginTop: afterHeading ? 8 : 18 };
  switch (b.t) {
    case 'h2': return <Text style={[s.h2, !prev && { marginTop: 0 }]}>{b.text}</Text>;
    case 'h3': return <Text style={[s.h3, !prev && { marginTop: 0 }]}>{b.text}</Text>;
    case 'p': return <Inline text={b.text} style={[s.p, gap, !prev && { marginTop: 0 }]} />;
    case 'ul': case 'ol':
      return (
        <View style={[gap, { gap: 8 }]}>
          {b.items.map((x, i) => (
            <View key={i} style={s.li}>
              {b.t === 'ol' ? <Text style={s.num}>{i + 1}.</Text> : <View style={s.dot} />}
              <Inline text={x} style={[s.p, { flex: 1 }]} />
            </View>
          ))}
        </View>
      );
    case 'img': return <Figure url={b.url} caption={b.caption} />;
    case 'table': return <Table b={b} />;
    case 'quote':
      return (
        <View style={s.quote}>
          <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.accent} />
          <Inline text={b.text} style={s.quoteText} />
          {b.by ? <Text style={s.quoteBy}>— {b.by}</Text> : null}
        </View>
      );
    case 'note': {
      const t = TONE[b.tone];
      return (
        <View style={[s.note, { backgroundColor: t.bg, borderColor: t.border }]}>
          <Ionicons name={t.icon} size={20} color={t.fg} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={[s.noteTitle, { color: t.fg }]}>{b.title || t.label}</Text>
            <Inline text={b.text} style={s.noteText} />
          </View>
        </View>
      );
    }
    case 'hr': return <View style={s.hr} />;
  }
}

// Görsel kendi oranıyla, ekran genişliğinde gösterilir
function Figure({ url, caption }: { url: string; caption: string }) {
  const [ratio, setRatio] = useState(16 / 9);
  const src = absolute(url)!;
  return (
    <View style={{ marginVertical: 22 }}>
      <Image source={src} style={[s.img, { aspectRatio: ratio }]} contentFit="cover" transition={200}
        onLoad={(e) => e.source.width && setRatio(e.source.width / e.source.height)} accessibilityLabel={caption || undefined} />
      {caption ? <Text style={s.caption}>{caption}</Text> : null}
    </View>
  );
}

// Tablo yana kaydırılabilir; başlık satırı lacivert, satırlar dönüşümlü zeminli
function Table({ b }: { b: Extract<BlogBlock, { t: 'table' }> }) {
  const { width } = useWindowDimensions();
  const cols = b.rows[0]?.length ?? 1;
  const colW = Math.max(130, (width - 32) / cols);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.table} contentContainerStyle={{ minWidth: width - 32 }}>
      <View>
        {b.rows.map((r, ri) => {
          const head = b.head && ri === 0;
          return (
            <View key={ri} style={[s.tr, head && { backgroundColor: colors.primary }, !head && ri % 2 === (b.head ? 0 : 1) && { backgroundColor: colors.surface }]}>
              {r.map((c, ci) => (
                <View key={ci} style={[s.td, { width: colW }]}>
                  <Inline text={c} style={head ? s.th : s.tdText} />
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h2: { color: colors.text, fontSize: 21, fontWeight: '800', lineHeight: 28, marginTop: 30 },
  h3: { color: colors.primary, fontSize: 17.5, fontWeight: '800', lineHeight: 24, marginTop: 22 },
  p: { color: '#334155', fontSize: 16, lineHeight: 27 },
  bold: { fontWeight: '800', color: colors.text },
  link: { color: colors.accent, fontWeight: '700', textDecorationLine: 'underline' },
  li: { flexDirection: 'row', gap: 10 },
  dot: { width: 7, height: 7, borderRadius: 2, backgroundColor: colors.accent, marginTop: 10 },
  num: { color: colors.accent, fontSize: 16, lineHeight: 27, fontWeight: '800', minWidth: 20 },
  img: { width: '100%', borderRadius: radius, backgroundColor: colors.surface },
  caption: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  table: { marginVertical: 20, borderRadius: radius, borderWidth: 1, borderColor: colors.border },
  tr: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  td: { paddingHorizontal: 12, paddingVertical: 10 },
  th: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  tdText: { color: '#334155', fontSize: 14, lineHeight: 21 },
  quote: { marginVertical: 22, padding: 18, borderLeftWidth: 4, borderLeftColor: colors.accent, borderRadius: radius, backgroundColor: colors.surface, gap: 8 },
  quoteText: { color: colors.text, fontSize: 17, lineHeight: 27, fontWeight: '500' },
  quoteBy: { color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  note: { flexDirection: 'row', gap: 10, marginVertical: 18, padding: 14, borderRadius: radius, borderWidth: 1 },
  noteTitle: { fontSize: 14.5, fontWeight: '800' },
  noteText: { color: '#334155', fontSize: 15, lineHeight: 24, marginTop: 3 },
  hr: { alignSelf: 'center', width: 80, height: 3, borderRadius: 2, backgroundColor: colors.border, marginVertical: 30 },
});
