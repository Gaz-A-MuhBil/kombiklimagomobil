import type { ComponentProps } from 'react';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type Icon = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Sitedeki kategoriler ve uygulamadaki simgeleri (sıra: ana sayfadaki kısayol sırası)
export const CATEGORY_ICONS: Record<string, Icon> = {
  Kombi: 'water-boiler',
  Klima: 'air-conditioner',
  'Isı Pompası': 'heat-pump-outline',
  Radyatör: 'radiator',
  'Oda Termostatı': 'thermostat',
  'Sirkülasyon Pompası': 'pump',
  Şofben: 'water-thermometer',
  Termosifon: 'water-boiler-auto',
};

export const iconFor = (c: string): Icon => CATEGORY_ICONS[c] ?? 'shape-outline';

// Ürünlerde geçen kategoriler; verilen sırayla (mevsim sırası, bkz. useSeason), yoksa yukarıdaki sırayla; diğerleri sonda
export const orderCategories = (cats: string[], order?: string[]) => {
  const known = order ?? Object.keys(CATEGORY_ICONS);
  return [...new Set(cats)].sort((a, b) => (known.indexOf(a) + 1 || 99) - (known.indexOf(b) + 1 || 99) || a.localeCompare(b, 'tr'));
};
