import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Bölüm başlığı: solda başlık, sağda isteğe bağlı "Tümü" bağlantısı
export function SectionHead({ title, onMore, more = 'Tümü' }: { title: string; onMore?: () => void; more?: string }) {
  return (
    <View style={s.row}>
      <Text style={s.title}>{title}</Text>
      {onMore && (
        <Pressable onPress={onMore} hitSlop={8} accessibilityRole="link" style={s.more}>
          <Text style={s.moreText}>{more}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
