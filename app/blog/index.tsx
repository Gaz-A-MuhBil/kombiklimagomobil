import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../src/theme';
import { api } from '../../src/client';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Button, ErrorBox } from '../../src/components/Form';
import { Cover, Meta, type PostSummary } from '../../src/components/BlogCards';

// Blog: rehber ve öneri yazıları; üstte kategori seçimi, ilk yazı büyük kart
export default function BlogList() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [cats, setCats] = useState<string[]>([]);
  const [cat, setCat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(
    () => api<{ posts: PostSummary[]; categories: string[] }>(`/api/app/blog${cat ? `?kategori=${encodeURIComponent(cat)}` : ''}`)
      .then((r) => { setPosts(r.posts); setCats(r.categories); setError(null); })
      .catch((e) => setError((e as Error).message)),
    [cat]
  );
  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  const refresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

  const [first, ...rest] = posts ?? [];
  const open = (slug: string) => router.push({ pathname: '/blog/[slug]', params: { slug } });

  return (
    <View style={s.screen}>
      <ScreenHeader title="Blog" />
      {error && !posts ? (
        <View style={{ padding: 20 }}><ErrorBox text={error} /><Button label="Tekrar dene" variant="ghost" onPress={fetchPosts} /></View>
      ) : !posts ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(p) => p.slug}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View>
              <View style={s.intro}>
                <Text style={s.eyebrow}>Rehberler ve öneriler</Text>
                <Text style={s.lead}>Doğru ürünü seçmek, verimli kullanmak ve bakımını yapmak için uzmanlarımızın yazıları.</Text>
              </View>
              {cats.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                  {[null, ...cats].map((c) => (
                    <Pressable key={c ?? 'tumu'} onPress={() => setCat(c)} style={[s.chip, cat === c && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: cat === c }}>
                      <Text style={[s.chipText, cat === c && { color: '#FFFFFF' }]}>{c ?? 'Tümü'}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {first ? (
                <Pressable onPress={() => open(first.slug)} style={s.featured} accessibilityRole="link">
                  <Cover post={first} style={s.featuredImg} />
                  <Meta post={first} />
                  <Text style={s.featuredTitle}>{first.title}</Text>
                  {first.excerpt ? <Text style={s.excerpt} numberOfLines={3}>{first.excerpt}</Text> : null}
                </Pressable>
              ) : (
                <View style={s.empty}>
                  <Ionicons name="newspaper-outline" size={34} color={colors.primary} />
                  <Text style={s.emptyText}>{cat ? 'Bu kategoride henüz yazı yok.' : 'Yakında burada yazılarımızı yayınlayacağız.'}</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item.slug)} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surface }]} accessibilityRole="link">
              <Cover post={item} style={s.rowImg} />
              <View style={{ flex: 1 }}>
                <Meta post={item} />
                <Text style={s.rowTitle} numberOfLines={3}>{item.title}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  intro: { paddingHorizontal: 16, paddingTop: 16 },
  eyebrow: { color: colors.text, fontSize: 22, fontWeight: '800' },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 4 },
  chips: { paddingHorizontal: 16, gap: 8, paddingTop: 14 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  featured: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  featuredImg: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius, marginBottom: 12 },
  featuredTitle: { color: colors.text, fontSize: 21, fontWeight: '800', lineHeight: 27, marginTop: 6 },
  excerpt: { color: colors.muted, fontSize: 14.5, lineHeight: 22, marginTop: 6 },
  row: { flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowImg: { width: 108, height: 76, borderRadius: radius },
  rowTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700', lineHeight: 21, marginTop: 4 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: colors.muted, fontSize: 14.5, textAlign: 'center' },
});
