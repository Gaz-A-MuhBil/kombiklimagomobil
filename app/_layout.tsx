import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme';
import { WhatsAppButton } from '../src/components/WhatsAppButton';
import { Splash } from '../src/components/Splash';
import { Onboarding } from '../src/components/Onboarding';
import { FavoriteToast } from '../src/components/FavoriteToast';
import { loadIntro, type IntroSlide } from '../src/onboarding';
import { listenNotificationTaps, registerPush } from '../src/push';
import { useAuth } from '../src/store/auth';

// Yerel açılış ekranı, animasyonlu Splash bileşeni çizilene kadar ekranda kalır
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [splash, setSplash] = useState(true);
  // İlk açılışta tanıtım sayfaları açılış ekranının altında hazırlanır
  const [intro, setIntro] = useState<IntroSlide[]>([]);
  useEffect(() => { loadIntro().then(setIntro); }, []);
  useEffect(listenNotificationTaps, []);
  // Bildirim izni açılış ekranı ve tanıtım bittikten sonra istenir; giriş yapılınca cihaz hesaba bağlanır
  const authToken = useAuth((st) => st.token);
  const ready = !splash && intro.length === 0;
  useEffect(() => { if (ready) registerPush(authToken); }, [ready, authToken]);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
        {/* alt sekme çubuğunun (~50px) üstünde durur */}
        <WhatsAppButton bottom={56} />
        <FavoriteToast />
        {intro.length > 0 && <Onboarding slides={intro} onDone={() => setIntro([])} />}
        {splash && <Splash onDone={() => setSplash(false)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
