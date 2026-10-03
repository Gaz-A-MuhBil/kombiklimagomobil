import { Linking, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { colors, radius, WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from '../theme';

export function WhatsAppButton({ bottom = 0 }: { bottom?: number }) {
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`);
  };
  // yalnızca ana sayfada ve hesabımda görünür; ürün ızgaralarında sepete ekle butonlarının, sepette sipariş butonunun üstüne binmesin
  if (path !== '/' && path !== '/account') return null;
  return (
    <MotiView
      from={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 600 }}
      style={[s.wrap, { bottom: bottom + insets.bottom + 16 }]}
      pointerEvents="box-none"
    >
      <Pressable onPress={open} accessibilityLabel="WhatsApp ile yazın" style={({ pressed }) => [s.btn, pressed && { transform: [{ scale: 0.94 }] }]}>
        <Ionicons name="logo-whatsapp" size={32} color="#fff" />
      </Pressable>
    </MotiView>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', right: 16 },
  btn: {
    width: 58, height: 58, borderRadius: radius, backgroundColor: colors.whatsapp,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
});
