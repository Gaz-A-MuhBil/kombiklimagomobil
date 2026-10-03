import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';

// Alt sayfaların üst barı: solda geri butonu, ortada başlık
export function ScreenHeader({ title }: { title: string }) {
  const { top } = useSafeAreaInsets();
  const back = () => (router.canGoBack() ? router.back() : router.navigate('/account'));
  return (
    <View style={[s.bar, { paddingTop: top + 6 }]}>
      <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Geri" hitSlop={6}
        style={({ pressed }) => [s.back, pressed && { backgroundColor: colors.surface }]}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      <View style={s.back} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  back: { width: 44, height: 44, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 17, fontWeight: '800' },
});
