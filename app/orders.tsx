import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../src/theme';
import { tl } from '../src/data';
import { absolute } from '../src/api';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Button, ErrorBox } from '../src/components/Form';
import { useAuth, type Order } from '../src/store/auth';
import { BANK } from '../src/components/BankCard';
import { openSite } from '../src/links';

const STATUS_COLOR: Record<string, [string, string]> = {
  pending: ['#FEF3C7', '#92400E'],
  confirmed: ['#DBEAFE', '#1E40AF'],
  preparing: ['#E0F2FE', '#075985'],
  shipped: ['#E0E7FF', '#3730A3'],
  delivered: ['#DCFCE7', '#166534'],
  cancelled: [colors.surfaceAlt, colors.muted],
};
const date = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

// Siparişlerim: giriş yapan kullanıcının siparişleri; karta dokununca ürünler ve adres açılır
export default function Orders() {
  const { token, orders, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { await refresh(); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [refresh]);
  // ekran açılınca siparişleri sessizce yenile (aşağı çekince de yenilenir)
  useEffect(() => {
    if (!token) return;
    let alive = true;
    refresh().catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, [token, refresh]);

  if (!token) {
    return (
      <View style={s.screen}>
        <ScreenHeader title="Siparişlerim" />
        <View style={s.empty}>
          <View style={s.emptyIcon}><Ionicons name="receipt-outline" size={34} color={colors.primary} /></View>
          <Text style={s.emptyTitle}>Siparişlerinizi görmek için giriş yapın</Text>
          <Text style={s.emptyText}>Sitede ya da uygulamada verdiğiniz siparişler hesabınızda listelenir.</Text>
          <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 20 }}>
            <Button label="Giriş Yap" onPress={() => router.push({ pathname: '/login', params: { next: '/orders' } })} />
            <Button label="Üye Ol" variant="ghost" onPress={() => router.push({ pathname: '/register', params: { next: '/orders' } })} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScreenHeader title="Siparişlerim" />
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListHeaderComponent={<ErrorBox text={error} />}
        ListEmptyComponent={loading ? null : (
          <View style={[s.empty, { paddingTop: 48 }]}>
            <View style={s.emptyIcon}><Ionicons name="bag-handle-outline" size={34} color={colors.primary} /></View>
            <Text style={s.emptyTitle}>Henüz siparişiniz yok</Text>
            <Text style={s.emptyText}>Verdiğiniz siparişler ve durumları burada görünür.</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 20 }}><Button label="Alışverişe başla" onPress={() => router.navigate('/categories')} /></View>
          </View>
        )}
        renderItem={({ item }) => <OrderCard order={item} open={open === item.id} onToggle={() => setOpen(open === item.id ? null : item.id)} />}
      />
    </View>
  );
}

function OrderCard({ order: o, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  const [bg, fg] = STATUS_COLOR[o.status] ?? STATUS_COLOR.cancelled;
  const count = o.items.reduce((t, i) => t + i.qty, 0);
  return (
    <Pressable onPress={onToggle} style={s.card} accessibilityRole="button" accessibilityState={{ expanded: open }}>
      <View style={s.cardTop}>
        <View>
          <Text style={s.no}>{o.no}</Text>
          <Text style={s.date}>{date(o.createdAt)}</Text>
        </View>
        <View style={[s.status, { backgroundColor: bg }]}><Text style={[s.statusText, { color: fg }]}>{o.statusLabel}</Text></View>
      </View>
      <View style={s.thumbs}>
        {o.items.slice(0, 4).map((i, k) => (
          <View key={k} style={s.thumb}>{i.image ? <Image source={absolute(i.image)} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}</View>
        ))}
        {o.items.length > 4 && <View style={s.thumb}><Text style={s.more}>+{o.items.length - 4}</Text></View>}
      </View>
      <View style={s.cardBottom}>
        <Text style={s.count}>{count} ürün</Text>
        <Text style={s.total}>{tl(o.total)}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </View>
      {/* ödeme bekleniyorsa havale bilgisi, kargodaysa takip */}
      {o.awaitingPayment && (
        <View style={s.info}>
          <Ionicons name="card-outline" size={16} color="#92400E" />
          <Text style={s.infoText}>Ödeme bekleniyor · {BANK.name} {BANK.iban.replace(/(.{4})/g, '$1 ').trim()} · Açıklama: {o.no}</Text>
        </View>
      )}
      {o.trackingNo && (
        <Pressable onPress={() => o.trackingUrl && openSite(o.trackingUrl)} style={[s.info, s.infoTrack]} accessibilityRole="link">
          <Ionicons name="car-outline" size={16} color={colors.primary} />
          <Text style={[s.infoText, { color: colors.primary }]}>{o.cargo} · Takip no: {o.trackingNo}{o.trackingUrl ? '  ›  Kargom nerede?' : ''}</Text>
        </Pressable>
      )}
      {open && (
        <View style={s.detail}>
          {o.items.map((i, k) => (
            <View key={k} style={s.line}>
              <Text style={s.lineName} numberOfLines={2}>{i.name}</Text>
              <Text style={s.lineQty}>{i.qty} × {tl(i.price)}</Text>
            </View>
          ))}
          <View style={s.addr}>
            <Ionicons name="location-outline" size={16} color={colors.muted} />
            <Text style={s.addrText}>{o.address}{o.city ? `, ${o.city}` : ''}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { padding: 14, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  no: { color: colors.text, fontSize: 15.5, fontWeight: '800' },
  date: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  status: { borderRadius: radius, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '800' },
  thumbs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  thumb: { width: 52, height: 52, borderRadius: radius, overflow: 'hidden', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  more: { color: colors.muted, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  count: { flex: 1, color: colors.muted, fontSize: 13 },
  total: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  info: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 12, padding: 10, borderRadius: radius, backgroundColor: '#FFFBEB' },
  infoTrack: { backgroundColor: colors.surface },
  infoText: { flex: 1, color: '#92400E', fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
  detail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  line: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  lineName: { flex: 1, color: colors.text, fontSize: 13.5, lineHeight: 18 },
  lineQty: { color: colors.muted, fontSize: 13 },
  addr: { flexDirection: 'row', gap: 6, marginTop: 4 },
  addrText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 18 },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 64 },
  emptyIcon: { width: 72, height: 72, borderRadius: radius, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 18, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 6 },
});
