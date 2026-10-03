import { Linking, Pressable, StyleSheet, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../theme';

const socials = [
  { icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/gazabilisim' },
  { icon: 'x-twitter', label: 'X (Twitter)', href: 'https://x.com/gazabilisim' },
  { icon: 'linkedin-in', label: 'LinkedIn', href: 'https://www.linkedin.com/company/gaza-bili%C5%9Fim/' },
] as const;

export function SocialLinks() {
  return (
    <View style={s.row}>
      {socials.map((x) => (
        <Pressable
          key={x.icon}
          accessibilityRole="link"
          accessibilityLabel={x.label}
          onPress={() => { Haptics.selectionAsync(); Linking.openURL(x.href); }}
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
        >
          <FontAwesome6 name={x.icon} brand size={18} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { width: 42, height: 42, borderRadius: radius, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
