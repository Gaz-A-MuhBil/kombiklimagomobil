import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { tl } from '../data';
import type { Extra, Selection, SortKey, SORTS, facetOptions } from '../filters';

type Options = ReturnType<typeof facetOptions>;
type Sort = (typeof SORTS)[number];
const tap = () => Haptics.selectionAsync().catch(() => {});

// Liste üstündeki "Filtrele" ve "Sırala" butonları ile seçili filtrelerin kaldırılabilir etiketleri
export function FilterBar({ count, sort, onFilter, onSort, chips, onClear }: {
  count: number; sort: Sort; onFilter: () => void; onSort: () => void;
  chips: { label: string; remove: () => void }[]; onClear: () => void;
}) {
  return (
    <View>
      <View style={s.bar}>
        <Pressable onPress={onFilter} accessibilityRole="button" accessibilityLabel={count ? `Filtrele, ${count} filtre seçili` : 'Filtrele'}
          style={({ pressed }) => [s.barBtn, count > 0 && s.barBtnOn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="options-outline" size={18} color={count ? '#FFFFFF' : colors.primary} />
          <Text style={[s.barText, count > 0 && { color: '#FFFFFF' }]}>Filtrele</Text>
          {count > 0 && <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>}
        </Pressable>
        <Pressable onPress={onSort} accessibilityRole="button" accessibilityLabel={`Sırala: ${sort.label}`}
          style={({ pressed }) => [s.barBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="swap-vertical" size={18} color={colors.primary} />
          <Text style={s.barText} numberOfLines={1}>{sort.short}</Text>
        </Pressable>
      </View>
      {chips.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} keyboardShouldPersistTaps="handled">
          {chips.map((c) => (
            <Pressable key={c.label} onPress={() => { tap(); c.remove(); }} accessibilityRole="button" accessibilityLabel={`${c.label} filtresini kaldır`} style={s.selChip}>
              <Text style={s.selChipText}>{c.label}</Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          ))}
          <Pressable onPress={onClear} accessibilityRole="button" hitSlop={6} style={s.clearChip}>
            <Text style={s.clearText}>Tümünü temizle</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

// Alttan açılan pencere: arka plana dokununca ya da geri tuşuyla kapanır
function Sheet({ visible, onClose, title, right, footer, children }: {
  visible: boolean; onClose: () => void; title: string; right?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode;
}) {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[s.backdrop, { paddingTop: top + 40 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
        <Animated.View entering={SlideInDown.duration(260)} style={[s.sheet, !footer && { paddingBottom: bottom + 12 }]}>
          <View style={s.grip} />
          <View style={s.head}>
            <Text style={s.headTitle}>{title}</Text>
            <View style={s.headRight}>
              {right}
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kapat" style={s.close}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>
          {children}
          {footer && <View style={[s.footer, { paddingBottom: bottom + 12 }]}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function FilterSheet({ visible, onClose, options, sel, extra, onToggle, onExtra, onClear, results, priceRange, selected }: {
  visible: boolean; onClose: () => void; options: Options; sel: Selection; extra: Extra;
  onToggle: (key: string, value: string) => void; onExtra: (e: Partial<Extra>) => void; onClear: () => void;
  results: number; priceRange: [number, number] | null; selected: number;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Filtrele"
      right={selected > 0 && <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button"><Text style={s.clearText}>Temizle</Text></Pressable>}
      footer={
        <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [s.primary, pressed && { opacity: 0.85 }]}>
          <Text style={s.primaryText}>{results ? `${results} ürünü göster` : 'Uygun ürün yok'}</Text>
        </Pressable>
      }>
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Section title="Durum">
          <Toggle label="Sadece stoktaki ürünler" value={extra.inStock} onChange={(v) => onExtra({ inStock: v })} />
          <Toggle label="Kampanyalı ürünler" value={extra.sale} onChange={(v) => onExtra({ sale: v })} />
        </Section>

        <Section title="Fiyat Aralığı" badge={extra.min || extra.max ? 1 : 0}>
          <View style={s.priceRow}>
            <PriceInput value={extra.min} placeholder="En az" onChange={(min) => onExtra({ min })} />
            <Text style={{ color: colors.muted }}>–</Text>
            <PriceInput value={extra.max} placeholder="En çok" onChange={(max) => onExtra({ max })} />
          </View>
          {priceRange && <Text style={s.hint}>Bu listede {tl(priceRange[0])} ile {tl(priceRange[1])} arası ürünler var.</Text>}
        </Section>

        {options.map(({ facet, values }) => (
          <Section key={facet.key} title={facet.title} badge={sel[facet.key]?.length ?? 0}
            note={facet.match === 'all' && (sel[facet.key]?.length ?? 0) > 1 ? 'Seçtiğiniz özelliklerin hepsine sahip ürünler gösterilir.' : undefined}>
            <View style={s.wrap}>
              {values.map(({ value, count }) => {
                const on = !!sel[facet.key]?.includes(value);
                const off = !on && count === 0;
                return (
                  <Pressable key={value} disabled={off} onPress={() => { tap(); onToggle(facet.key, value); }}
                    accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: off }} accessibilityLabel={`${value}, ${count} ürün`}
                    style={[s.opt, on && s.optOn, off && { opacity: 0.4 }]}>
                    {on && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    <Text style={[s.optText, on && { color: '#FFFFFF' }]}>{value}</Text>
                    <Text style={[s.optCount, on && { color: 'rgba(255,255,255,0.8)' }]}>{count}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        ))}
      </ScrollView>
    </Sheet>
  );
}

export function SortSheet({ visible, onClose, options, value, onChange }: {
  visible: boolean; onClose: () => void; options: readonly Sort[]; value: SortKey; onChange: (k: SortKey) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Sırala">
      <View style={{ paddingHorizontal: 8 }}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Pressable key={o.key} onPress={() => { tap(); onChange(o.key); onClose(); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={({ pressed }) => [s.sortRow, pressed && { backgroundColor: colors.surface }]}>
              <Text style={[s.sortText, on && { color: colors.primary, fontWeight: '800' }]}>{o.label}</Text>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.primary : colors.border} />
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

function Section({ title, badge = 0, note, children }: { title: string; badge?: number; note?: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {badge > 0 && <View style={s.badgeDark}><Text style={s.badgeText}>{badge}</Text></View>}
      </View>
      {children}
      {note && <Text style={s.hint}>{note}</Text>}
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} style={s.toggle}>
      <Text style={s.toggleText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#FFFFFF" />
    </Pressable>
  );
}

function PriceInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <View style={s.price}>
      <TextInput value={value} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} placeholder={placeholder} placeholderTextColor={colors.muted}
        keyboardType="number-pad" returnKeyType="done" maxLength={8} style={s.priceInput} accessibilityLabel={`${placeholder} fiyat`} />
      <Text style={{ color: colors.muted, fontSize: 14 }}>₺</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  barBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, paddingHorizontal: 10,
    borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
  },
  barBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  barText: { color: colors.primary, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: radius, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeDark: { minWidth: 20, height: 20, borderRadius: radius, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' },
  chips: { paddingHorizontal: 16, gap: 8, paddingTop: 10, alignItems: 'center' },
  selChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 10, borderRadius: radius, backgroundColor: colors.surfaceAlt },
  selChipText: { color: colors.primary, fontSize: 12.5, fontWeight: '700' },
  clearChip: { height: 32, justifyContent: 'center', paddingHorizontal: 6 },
  clearText: { color: colors.accent, fontSize: 13.5, fontWeight: '700' },

  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { maxHeight: '100%', backgroundColor: colors.bg, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  headTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16, paddingBottom: 8 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  primary: { height: 50, borderRadius: radius, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },

  section: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  optOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  optText: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  optCount: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  toggleText: { color: colors.text, fontSize: 14.5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 12, borderRadius: radius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  priceInput: { flex: 1, minWidth: 0, width: '100%', color: colors.text, fontSize: 15, paddingVertical: 0 },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 12, borderRadius: radius },
  sortText: { color: colors.text, fontSize: 15 },
});
