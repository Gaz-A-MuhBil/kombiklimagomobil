import { createElement } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from '../theme';
import { API_URL } from '../api';

const BASE = API_URL || 'https://kombiklimago.com';

// Adresin Google Haritalar gömülü görünümü (sitedeki İletişim sayfasındaki haritanın aynısı).
// Google gömülü haritayı yalnızca iframe içinde açar; doğrudan adres olarak yüklenince hata sayfası gösterir.
export function MapEmbed({ address, height = 220 }: { address: string; height?: number }) {
  const uri = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${uri}" allowfullscreen></iframe></body></html>`;
  return (
    <View style={[s.box, { height }]}>
      {Platform.OS === 'web'
        ? createElement('iframe', { src: uri, title: 'Konum', loading: 'lazy', style: { border: 0, width: '100%', height: '100%' } })
        : (
          <WebView source={{ html, baseUrl: BASE }} originWhitelist={['*']} style={{ flex: 1 }} startInLoadingState nestedScrollEnabled
            setSupportMultipleWindows={false}
            // "Haritalar'da aç" gibi bağlantılar telefonun harita uygulamasında / tarayıcıda açılır
            onShouldStartLoadWithRequest={(r) => {
              if (r.isTopFrame === false || r.url === 'about:blank' || r.url.startsWith('data:') || r.url.startsWith(BASE)) return true;
              Linking.openURL(r.url).catch(() => {});
              return false;
            }}
            renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.primary} />} />
        )}
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
