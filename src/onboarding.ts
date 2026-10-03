import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { API_URL, absolute } from './api';

// Uygulamayı ilk kez açan kişiye gösterilen tanıtım sayfaları (admin → Mobil Uygulama → Tanıtım Ekranları)
export type IntroSlide = { id: string; title: string; text: string; image: string };

const SEEN_KEY = 'kkgo:tanitim-goruldu';
const WAIT_MS = 2500; // açılış ekranı bitmeden cevap gelmezse tanıtım bir sonraki açılışa kalır

const timeout = <T,>(ms: number, value: T) => new Promise<T>((r) => setTimeout(() => r(value), ms));

// Daha önce görüldüyse, adres tanımlı değilse ya da yayında sayfa yoksa boş liste döner
export async function loadIntro(): Promise<IntroSlide[]> {
  try {
    if (!API_URL || (await AsyncStorage.getItem(SEEN_KEY))) return [];
    const rows = await Promise.race([
      fetch(`${API_URL}/api/onboarding`).then((r) => (r.ok ? (r.json() as Promise<IntroSlide[]>) : [])),
      timeout(WAIT_MS, [] as IntroSlide[]),
    ]);
    const slides = rows.map((r) => ({ ...r, image: absolute(r.image)! })).filter((r) => r.image);
    if (slides.length) Image.prefetch(slides.map((s) => s.image)).catch(() => {});
    return slides;
  } catch {
    return [];
  }
}

export const markIntroSeen = () => AsyncStorage.setItem(SEEN_KEY, '1').catch(() => {});
