import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme';
import { absolute } from '../api';

// Blog listesi ve yazı sonundaki "Diğer yazılar" için ortak parçalar
export type PostSummary = { slug: string; title: string; excerpt: string; category: string; cover: string | null; date: string; readMin: number };

export function Cover({ post, style }: { post: PostSummary; style: object }) {
  return post.cover ? (
    <Image source={absolute(post.cover)} style={style} contentFit="cover" transition={200} />
  ) : (
    <View style={[style, s.noCover]}><Text style={s.noCoverText}>KOMBİ KLİMA GO</Text></View>
  );
}

export function Meta({ post }: { post: PostSummary }) {
  return (
    <Text style={s.meta} numberOfLines={1}>
      {post.category ? <Text style={s.metaCat}>{post.category.toLocaleUpperCase('tr-TR')}  ·  </Text> : null}
      {post.date}  ·  {post.readMin} dk
    </Text>
  );
}

const s = StyleSheet.create({
  meta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  metaCat: { color: colors.accent, fontWeight: '800', letterSpacing: 0.6 },
  noCover: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  noCoverText: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', letterSpacing: 3 },
});
