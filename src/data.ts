import type { Product } from './store/cart';

// API'ye ulaşılamazsa gösterilen örnek ürünler
export const products: Product[] = [
  { id: '1', name: 'Örnek Inverter Split Klima 12.000 BTU', brand: 'Örnek Marka', category: 'Klima', price: 24990, oldPrice: 27990, inStock: true },
  { id: '2', name: 'Örnek Salon Tipi Klima 24.000 BTU', brand: 'Örnek Marka', category: 'Klima', price: 54990, oldPrice: null, inStock: true },
];

export const tl = (n: number) => n.toLocaleString('tr-TR') + ' ₺';
