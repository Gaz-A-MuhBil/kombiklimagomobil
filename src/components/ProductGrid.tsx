import { FlatList, StyleSheet, Text, View, useWindowDimensions, type ListRenderItem } from 'react-native';
import { colors } from '../theme';
import type { Product } from '../store/cart';
import { ProductTile } from './ProductTile';

const GAP = 12;
const PAD = 16;

// İki sütunlu ürün ızgarası (kategoriler, kampanyalar, favoriler)
export function ProductGrid({ data, header, empty }: { data: Product[]; header?: React.ReactElement; empty?: React.ReactElement | string }) {
  const { width } = useWindowDimensions();
  const w = (width - PAD * 2 - GAP) / 2;
  const render: ListRenderItem<Product> = ({ item }) => <ProductTile product={item} width={w} />;
  return (
    <FlatList
      data={data}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
      contentContainerStyle={{ gap: 20, paddingBottom: 110 }}
      ListHeaderComponent={header}
      ListEmptyComponent={typeof empty === 'string' ? <View style={s.empty}><Text style={s.emptyText}>{empty}</Text></View> : empty}
      renderItem={render}
      initialNumToRender={8}
      windowSize={7}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const s = StyleSheet.create({
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
