import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';
import { useFavorites } from '../../src/store/favorites';

type Icon = keyof typeof Ionicons.glyphMap;
const icon = (on: Icon, off: Icon) => {
  const TabIcon = ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? on : off} color={color as string} size={size - 1} />
  );
  return TabIcon;
};

// Alt menü: 5 sekme. Sepet sekme değildir; üst bardaki sepet simgesinden açılır.
export default function TabsLayout() {
  const favs = useFavorites((s) => s.ids.length);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarBadgeStyle: { backgroundColor: colors.accent, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="categories" options={{ title: 'Kategoriler', tabBarIcon: icon('grid', 'grid-outline') }} />
      <Tabs.Screen name="campaigns" options={{ title: 'Kampanyalar', tabBarIcon: icon('pricetags', 'pricetags-outline') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoriler', tabBarBadge: favs || undefined, tabBarIcon: icon('heart', 'heart-outline') }} />
      <Tabs.Screen name="account" options={{ title: 'Hesabım', tabBarIcon: icon('person', 'person-outline') }} />
      <Tabs.Screen name="cart" options={{ href: null, title: 'Sepet' }} />
    </Tabs>
  );
}
