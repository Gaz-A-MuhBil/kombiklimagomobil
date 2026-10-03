import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { api } from './client';
import { openSite } from './links';

// Anlık bildirimler (Expo Push). Telefonun push adresi sunucuya kaydedilir; giriş yapılmışsa kullanıcıya bağlanır.
// Admin panelinden gönderilen kampanya bildirimleri ve sipariş durumu bildirimleri bu adrese gelir.
const KEY = 'kkgo:push-token';

// Uygulama açıkken gelen bildirim de ekranın üstünde gösterilir
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export const getSavedPushToken = () => AsyncStorage.getItem(KEY).catch(() => null);

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function permissionState(): Promise<PermissionState> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

// İzin ister (gerekirse), push adresini alır ve sunucuya kaydeder. authToken varsa cihaz kullanıcıya bağlanır.
export async function registerPush(authToken: string | null, ask = true): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Bildirimler', importance: Notifications.AndroidImportance.HIGH, lightColor: '#0F2A47', vibrationPattern: [0, 200, 120, 200],
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && ask) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    // EAS proje kimliği (npx eas init ile app.json'a yazılır)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) { console.warn('[push] EAS projectId yok: "npx eas init" çalıştırın.'); return null; }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await AsyncStorage.setItem(KEY, token).catch(() => {});
    await api('/api/app/push', { body: { token, platform: Platform.OS }, token: authToken }).catch(() => {});
    return token;
  } catch (e) {
    console.warn('[push]', (e as Error).message);
    return null;
  }
}

// Çıkış yapınca cihaz kullanıcıdan ayrılır (sipariş bildirimleri bu telefona gelmez)
export async function unlinkPush() {
  const token = await getSavedPushToken();
  if (token) await api('/api/app/push', { body: { token, logout: true } }).catch(() => {});
}

// Bildirime dokununca: uygulama sayfası (kampanyalar, kategori:X, /orders), ürün / blog (uygulamada) ya da site adresi
export function openTarget(url: string) {
  if (!url) return router.navigate('/');
  if (url === 'kampanyalar') return router.navigate('/campaigns');
  if (url.startsWith('kategori:')) return router.navigate({ pathname: '/categories', params: { c: url.slice(9) } });
  if (url === '/orders') return router.push('/orders');
  const urun = url.match(/^\/urun\/([^/?#]+)/);
  if (urun) return router.push({ pathname: '/product/[slug]', params: { slug: urun[1] } });
  const blog = url.match(/^\/blog\/([^/?#]+)/);
  if (blog) return router.push({ pathname: '/blog/[slug]', params: { slug: blog[1] } });
  openSite(url);
}

// Kök düzende bir kez çağrılır: dokunulan bildirimi (uygulama kapalıyken açılanlar dahil) ilgili sayfaya yönlendirir
export function listenNotificationTaps() {
  if (Platform.OS === 'web') return () => {};
  const handle = (r: Notifications.NotificationResponse | null) => {
    const url = r?.notification.request.content.data?.url;
    if (typeof url === 'string') setTimeout(() => openTarget(url), 300);
  };
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
