import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Favori ürün kimlikleri telefonda saklanır
type FavState = { ids: string[]; toggle: (id: string) => void };

// Her favori değişikliğinde artan sayaç; ekranın ortasındaki kısa kalp bildirimini tetikler (FavoriteToast)
export const useFavPulse = create<{ n: number; added: boolean }>(() => ({ n: 0, added: true }));

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const added = !get().ids.includes(id);
        set((s) => ({ ids: added ? [id, ...s.ids] : s.ids.filter((x) => x !== id) }));
        useFavPulse.setState((p) => ({ n: p.n + 1, added }));
      },
    }),
    { name: 'kkgo:favoriler', storage: createJSONStorage(() => AsyncStorage) }
  )
);
