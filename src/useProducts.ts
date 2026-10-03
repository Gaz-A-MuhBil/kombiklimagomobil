import { useEffect } from 'react';
import { create } from 'zustand';
import { API_URL, absolute } from './api';
import { products as sample } from './data';
import type { Product } from './store/cart';

type ApiProduct = { id: string; slug: string; name: string; brand: string; category: string; price: number; oldPrice: number | null; inStock: boolean; imageUrl: string | null };

// Ürünler web sitesindeki /api/products ucundan bir kez okunur ve tüm ekranlarca paylaşılır
const useStore = create<{ products: Product[]; loading: boolean; started: boolean; load: () => void }>((set, get) => ({
  products: sample,
  loading: !!API_URL,
  started: false,
  load: () => {
    if (!API_URL || get().started) return;
    set({ started: true });
    fetch(`${API_URL}/api/products`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((rows: ApiProduct[]) =>
        set({
          products: rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, brand: r.brand, category: r.category, price: r.price, oldPrice: r.oldPrice, inStock: r.inStock, imageUrl: absolute(r.imageUrl) })),
        })
      )
      .catch(() => set({ started: false })) // hata olursa örnek veri kalır, sonraki açılışta yeniden denenir
      .finally(() => set({ loading: false }));
  },
}));

export function useProducts() {
  const { products, loading, load } = useStore();
  useEffect(load, [load]);
  return { products, loading };
}

export const onSale = (p: Product) => !!p.oldPrice && p.oldPrice > p.price && p.price > 0;
export const discount = (p: Product) => (onSale(p) ? Math.round((1 - p.price / p.oldPrice!) * 100) : 0);
