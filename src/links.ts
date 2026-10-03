import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from './api';
import { colors, WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from './theme';

export const PHONE = '0533 194 49 52';
const SITE = API_URL || 'https://kombiklimago.com';

// Sitedeki bir sayfayı (ya da tam adresi) uygulama içi tarayıcıda açar: giriş, üyelik, sözleşmeler, ürün detayı
export const openSite = (path: string) =>
  WebBrowser.openBrowserAsync(/^https?:/.test(path) ? path : `${SITE}${path}`, { toolbarColor: colors.primary, controlsColor: colors.primary }).catch(() => {});

export const call = () => Linking.openURL(`tel:${PHONE.replace(/\s/g, '')}`).catch(() => {});
export const whatsapp = (text = WHATSAPP_MESSAGE) =>
  Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`).catch(() => {});
