import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../src/theme';
import { api } from '../../src/client';
import { call } from '../../src/links';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { BlogBlocks, type BlogBlock } from '../../src/components/BlogBlocks';
import { Button, ErrorBox } from '../../src/components/Form';
import { Cover, Meta, type PostSummary } from '../../src/components/BlogCards';

type Detail = { post: PostSummary & { blocks: BlogBlock[] }; related: PostSummary[] };

// Blog yazısı: kapak, başlık, özet, içerik blokları, danışmanlık kutusu ve diğer yazılar
export default function BlogPost() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(() => api<Detail>(`/api/app/blog/${slug}`).then(setData).catch((e) => setError((e as Error).message)), [slug]);
  useEffect(() => { fetchPost(); }, [fetchPost]);

  const p = data?.post;
  return (
    <View style={s.screen}>
      <ScreenHeader title="Blog" />
      {error && !p ? (
        <View style={{ padding: 20 }}><ErrorBox text={error} /><Button label="Tekrar dene" variant="ghost" onPress={() => { setError(null); fetchPost(); }} /></View>
      ) : !p ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
          <View style={s.head}>
            <Meta post={p} />
            <Text style={s.title}>{p.title}</Text>
            {p.excerpt ? <Text style={s.excerpt}>{p.excerpt}</Text> : null}
          </View>
          {p.cover && <Cover post={p} style={s.cover} />}
          <View style={s.body}><BlogBlocks blocks={p.blocks} /></View>

          <View style={s.cta}>
            <Text style={s.ctaEyebrow}>Uzmanına danışın</Text>
            <Text style={s.ctaTitle}>Projeniz için doğru çözümü birlikte belirleyelim</Text>
            <View style={{ gap: 10, marginTop: 16 }}>
              <Pressable onPress={() => router.push('/lead')} style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.85 }]}>
                <Text style={s.ctaBtnText}>Bilgi / teklif al</Text>
              </Pressable>
              <Pressable onPress={call} style={({ pressed }) => [s.ctaBtn, s.ctaGhost, pressed && { opacity: 0.85 }]}>
                <Ionicons name="call-outline" size={17} color="#FFFFFF" />
                <Text style={[s.ctaBtnText, { color: '#FFFFFF' }]}>Bizi arayın</Text>
              </Pressable>
            </View>
          </View>

          {data.related.length > 0 && (
            <View style={{ marginTop: 32 }}>
              <Text style={s.relHead}>Diğer yazılar</Text>
              {data.related.map((r) => (
                <Pressable key={r.slug} onPress={() => router.push({ pathname: '/blog/[slug]', params: { slug: r.slug } })}
                  style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surface }]}>
                  <Cover post={r} style={s.rowImg} />
                  <View style={{ flex: 1 }}>
                    <Meta post={r} />
                    <Text style={s.rowTitle} numberOfLines={3}>{r.title}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 20, paddingTop: 20 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', lineHeight: 33, marginTop: 8 },
  excerpt: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 10 },
  cover: { width: '100%', aspectRatio: 16 / 9, marginTop: 20 },
  body: { paddingHorizontal: 20, paddingTop: 22 },
  cta: { marginHorizontal: 20, marginTop: 36, padding: 20, borderRadius: radius, backgroundColor: colors.primary },
  ctaEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  ctaTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', lineHeight: 25, marginTop: 6 },
  ctaBtn: { height: 46, borderRadius: radius, backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  ctaGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' },
  ctaBtnText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  relHead: { color: colors.text, fontSize: 18, fontWeight: '800', paddingHorizontal: 20, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowImg: { width: 100, height: 70, borderRadius: radius },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20, marginTop: 4 },
});
