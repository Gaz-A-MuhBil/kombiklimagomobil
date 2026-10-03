import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Product = {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  imageUrl?: string | null;
};
type CartItem = Product & { qty: number };

type CartState = {
  items: CartItem[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  total: () => number;
  count: () => number;
  coupon: string | null; // uygulanan indirim kuponu
  setCoupon: (code: string | null) => void;
};

// Sepet telefonda saklanır; uygulama kapanıp açılınca kaybolmaz
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p) =>
        set((s) => {
          const found = s.items.find((i) => i.id === p.id);
          return {
            items: found
              ? s.items.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
              : [...s.items, { ...p, qty: 1 }],
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) => set((s) => ({ items: qty < 1 ? s.items.filter((i) => i.id !== id) : s.items.map((i) => (i.id === id ? { ...i, qty } : i)) })),
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      total: () => get().items.reduce((t, i) => t + i.price * i.qty, 0),
      count: () => get().items.reduce((t, i) => t + i.qty, 0),
    }),
    { name: 'kkgo:sepet', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ items: s.items, coupon: s.coupon }) }
  )
);
