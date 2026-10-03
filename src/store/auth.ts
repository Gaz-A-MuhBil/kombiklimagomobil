import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { api } from '../client';
import { unlinkPush } from '../push';

export type User = { id: number; firstName: string; lastName: string; email: string; phone: string | null };
export type OrderItem = { name: string; price: number; qty: number; image: string | null; slug: string | null };
export type Order = {
  id: number; no: string; status: string; statusLabel: string; total: number; createdAt: string; city: string; address: string; items: OrderItem[];
  cargo?: string | null; trackingNo?: string | null; trackingUrl?: string | null; awaitingPayment?: boolean;
};
export type RegisterData = { firstName: string; lastName: string; email: string; phone: string; password: string; kvkk: boolean; newsletter: boolean };

// Oturum belirteci telefonda şifreli alanda (Keychain / Keystore) saklanır; tarayıcı önizlemesinde yerel depoda
const secure: StateStorage = Platform.OS === 'web'
  ? AsyncStorage
  : { getItem: (k) => SecureStore.getItemAsync(k), setItem: (k, v) => SecureStore.setItemAsync(k, v), removeItem: (k) => SecureStore.deleteItemAsync(k) };

type AuthState = {
  token: string | null;
  user: User | null;
  orders: Order[];
  login: (email: string, password: string) => Promise<void>;
  register: (d: RegisterData) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<void>;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      orders: [],
      login: async (email, password) => {
        const r = await api<{ token: string; user: User }>('/api/app/login', { body: { email, password } });
        set({ token: r.token, user: r.user, orders: [] });
      },
      register: async (d) => {
        const r = await api<{ token: string; user: User }>('/api/app/register', { body: d });
        set({ token: r.token, user: r.user, orders: [] });
      },
      // Kullanıcı bilgisi ve siparişleri yeniler; oturum geçersizse çıkış yapılır
      refresh: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const r = await api<{ user: User; orders: Order[] }>('/api/app/me', { token });
          set({ user: r.user, orders: r.orders });
        } catch (e) {
          if ((e as { status?: number }).status === 401) set({ token: null, user: null, orders: [] });
          throw e;
        }
      },
      logout: () => { unlinkPush(); set({ token: null, user: null, orders: [] }); },
      // Hesabı sunucuda kalıcı olarak siler (parola ile); ardından oturum kapanır
      deleteAccount: async (password) => {
        await api('/api/app/account-delete', { body: { password }, token: get().token });
        set({ token: null, user: null, orders: [] });
      },
    }),
    { name: 'kkgo-oturum', storage: createJSONStorage(() => secure), partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
