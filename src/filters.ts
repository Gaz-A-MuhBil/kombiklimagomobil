import type { Product } from './store/cart';
import { onSale } from './useProducts';

// Ürün listesindeki filtreler ve sıralama. Özellikler admin panelindeki teknik özelliklerden (specs),
// yoksa ürün adından okunur: kombide kW / garanti / premix, klimada BTU / tip / enerji sınıfı, radyatörde boy vb.

export type Facet = {
  key: string;
  title: string;
  values: (p: Product) => string[];
  // "all": seçilen değerlerin hepsi olmalı (özellikler); varsayılan: herhangi biri yeterli
  match?: 'any' | 'all';
  // değerlerin sırası; verilmezse alfabetik
  rank?: (v: string) => number;
  // en az bu kadar farklı değer yoksa filtre gösterilmez
  minValues?: number;
};

const low = (t: string) => t.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/̇/g, ''); // "İ" bazı cihazlarda "i̇" olur
const text = (p: Product) => low(`${p.name} ${Object.values(p.specs ?? {}).join(' ')}`);
const spec = (p: Product, ...keys: string[]) => {
  for (const [k, v] of Object.entries(p.specs ?? {})) if (keys.includes(low(k)) && v) return String(v);
  return null;
};
const num = (v: string) => Number(v.replace(',', '.'));
const fmt = (n: number) => n.toLocaleString('tr-TR');
const firstNum = (v: string) => Number(v.match(/[\d.,]+/)?.[0].replace(/\./g, '').replace(',', '.') ?? NaN);

/* ---------- Kapasite: kW, BTU, litre, boy ---------- */

// Kombide ısıtma kapasitesi: "24 kW", "20-24 kW", "24/24", "P24", "26 CS", Vaillant "236/5" (≈24)
export function kombiKw(p: Product): number | null {
  const t = text(p);
  const m =
    t.match(/(?:^|[^\d])(\d{2})\s*(?:[-/–]\s*\d{2}\s*)?kw/) ??
    t.match(/(?:^|[^\d])(\d{2})\s*\/\s*\d{2}(?!\d)/) ??
    t.match(/(?:^|[^\w])p(\d{2})(?!\d)/) ??
    t.match(/(?:^|[^\d])(\d{2})\s*cs\b/) ??
    t.match(/(?:^|[^\d])(\d{2})\s*[–-]\s*\d{2}\s*model/);
  if (m) return Number(m[1]);
  const v = t.match(/(?:^|[^\d])(\d{2})6\/\d/);
  return v ? Number(v[1]) + (Number(v[1]) % 2) : null;
}

// Isı pompasında kW ("15,9kw" → 16)
export function pumpKw(p: Product): number | null {
  const m = text(p).match(/(?:^|[^\d.,])(\d{1,2}(?:[.,]\d)?)\s*kw/);
  return m ? Math.round(num(m[1])) : null;
}

// Klimada BTU ("24.020 BTU" → 24.000)
export function btu(p: Product): number | null {
  const s = spec(p, 'kapasite');
  const m = (s && low(s).includes('btu') ? low(s) : text(p)).match(/(\d{1,3}(?:[.,]?\d{3}))\s*btu/);
  return m ? Math.round(Number(m[1].replace(/[.,]/g, '')) / 1000) * 1000 : null;
}

const litre = (p: Product) => { const m = text(p).match(/(\d{1,3})\s*(?:lt|litre)\b/); return m ? Number(m[1]) : null; };
const radLength = (p: Product) => { const m = text(p).match(/\d{3}\s*[×x]\s*(\d{3,4})/); return m ? Number(m[1]) : null; };

// Kapasiteye göre sıralamada kullanılan sayı (kategoriye göre)
export function capacity(p: Product): number | null {
  switch (p.category) {
    case 'Kombi': return kombiKw(p);
    case 'Klima': return btu(p);
    case 'Isı Pompası': return pumpKw(p);
    case 'Şofben': case 'Termosifon': return litre(p);
    case 'Radyatör': return radLength(p);
    default: return null;
  }
}

// Sayıyı aralıklara böler: [20, 24, 28, 35] → "20 kW ve altı", "21–24 kW", …, "36 kW ve üzeri"
function band(cuts: number[], unit: string) {
  const labels = [`${fmt(cuts[0])} ${unit} ve altı`, ...cuts.slice(1).map((c, i) => `${fmt(cuts[i] + 1)}–${fmt(c)} ${unit}`), `${fmt(cuts[cuts.length - 1] + 1)} ${unit} ve üzeri`];
  return {
    of: (n: number | null) => {
      if (n == null) return [];
      const i = cuts.findIndex((c) => n <= c);
      return [labels[i === -1 ? cuts.length : i]];
    },
    rank: (v: string) => labels.indexOf(v),
  };
}

const exact = (get: (p: Product) => number | null, unit: string) => ({
  values: (p: Product) => { const n = get(p); return n == null ? [] : [`${fmt(n)} ${unit}`]; },
  rank: firstNum,
});

/* ---------- Ortak özellikler ---------- */

function garanti(p: Product): string[] {
  const s = spec(p, 'garanti süresi', 'garanti');
  if (s) {
    const n = firstNum(s);
    if (n) return [`${low(s).includes('ay') ? Math.round(n / 12) : n} Yıl`];
  }
  const m = text(p).match(/(\d{1,2})\s*yil\s*garanti/);
  return m ? [`${Number(m[1])} Yıl`] : [];
}

// Ad veya teknik özelliklerde geçen kelimelere göre etiketler
const tags = (rules: [string, RegExp][]) => (p: Product) => { const t = text(p); return rules.filter(([, r]) => r.test(t)).map(([l]) => l); };

const energy = (p: Product) => { const m = (spec(p, 'enerji sınıfı', 'enerji sinifi') ?? p.name).match(/\bA\+{1,3}/i); return m ? [m[0].toUpperCase()] : []; };
const color = tags([['Beyaz', /\bbeyaz\b/], ['Gri', /\bgri\b/], ['Siyah', /\bsiyah\b/]]);

const garantiFacet: Facet = { key: 'garanti', title: 'Garanti Süresi', values: garanti, rank: firstNum };
const kombiBand = band([20, 24, 28, 35], 'kW');
const pumpBand = band([8, 12, 16], 'kW');

const CATEGORY_FACETS: Record<string, Facet[]> = {
  Kombi: [
    { key: 'kw', title: 'Kapasite', values: (p) => kombiBand.of(kombiKw(p)), rank: kombiBand.rank },
    { key: 'ozellik', title: 'Özellikler', match: 'all', values: tags([
      ['Tam Yoğuşmalı', /yo[gğ]u[sş]mal|condens/], ['Premix', /premix/], ['Wi-Fi / Akıllı', /wi-?fi|connect|smart/],
      ['Dokunmatik Ekran', /dokunmatik/], ['Sessiz', /sessiz/],
    ]) },
    garantiFacet,
  ],
  Klima: [
    { key: 'btu', title: 'Kapasite', ...exact(btu, 'BTU') },
    { key: 'tip', title: 'Klima Tipi', values: (p) => {
      const t = text(p);
      if (/hava temizleme/.test(t)) return ['Hava Temizleme Cihazı'];
      if (/salon tipi/.test(t)) return ['Salon Tipi'];
      return btu(p) ? ['Duvar Tipi'] : [];
    } },
    { key: 'ozellik', title: 'Özellikler', match: 'all', values: tags([['Inverter', /inverter/], ['R32 Gaz', /\br32\b/], ['Montaj Dahil', /montaj dahil/]]) },
    { key: 'enerji', title: 'Enerji Sınıfı', values: energy, rank: (v) => -v.length },
    { key: 'renk', title: 'Renk', values: color },
    garantiFacet,
  ],
  'Isı Pompası': [
    { key: 'kw', title: 'Kapasite', values: (p) => pumpBand.of(pumpKw(p)), rank: pumpBand.rank },
    { key: 'tip', title: 'Tip', values: tags([['Monoblok', /monoblok|\bmono\b/], ['Split', /split/]]) },
    { key: 'ozellik', title: 'Özellikler', match: 'all', values: tags([['Inverter', /inverter/], ['R32 Gaz', /\br32\b/]]) },
    garantiFacet,
  ],
  Radyatör: [
    { key: 'boy', title: 'Uzunluk', ...exact(radLength, 'mm') },
    { key: 'tip', title: 'Panel Tipi', values: (p) => { const m = text(p).match(/tip\s*(\d{2})/); return m ? [`Tip ${m[1]}`] : []; } },
  ],
  'Oda Termostatı': [
    { key: 'ozellik', title: 'Özellikler', match: 'all', values: tags([['Kablosuz', /kablosuz|\brf\b/], ['Akıllı / Uygulamalı', /akilli|connect|wi-?fi/], ['On/Off', /on\/off/]]) },
  ],
  Şofben: [
    { key: 'litre', title: 'Kapasite', ...exact(litre, 'Lt') },
    { key: 'ozellik', title: 'Özellikler', match: 'all', values: tags([['Hermetik', /herm[ae]tik/], ['Doğalgazlı', /do[gğ]algaz/]]) },
  ],
  Termosifon: [{ key: 'litre', title: 'Kapasite', ...exact(litre, 'Lt') }],
  'Sirkülasyon Pompası': [
    { key: 'cap', title: 'Bağlantı Çapı', values: (p) => { const m = text(p).match(/\bhmd?-(\d{2})-/); return m ? [`DN${m[1]}`] : []; }, rank: firstNum },
  ],
};

// Teknik özelliklerde olup yukarıda karşılığı olmayan alanlar ayrı filtre olur (ör. "Montaj", "Kurulum")
const KNOWN_SPECS = ['marka', 'ürün grubu', 'kapasite', 'garanti süresi', 'garanti', 'enerji sınıfı', 'enerji sinifi', 'montaj'];

export function facetsFor(category: string | null, products: Product[]): Facet[] {
  const list: Facet[] = [{ key: 'marka', title: 'Marka', values: (p) => (p.brand ? [p.brand] : []) }];
  if (!category) return list;
  list.push(...(CATEGORY_FACETS[category] ?? []));
  list.push({ key: 'grup', title: 'Ürün Grubu', minValues: 2, values: (p) => (p.productGroup ? [p.productGroup] : []) });
  const extra = new Set<string>();
  for (const p of products) for (const k of Object.keys(p.specs ?? {})) if (!KNOWN_SPECS.includes(low(k))) extra.add(k);
  for (const k of extra) list.push({ key: `spec:${k}`, title: k, minValues: 2, values: (p) => (p.specs?.[k] ? [String(p.specs[k])] : []) });
  return list;
}

/* ---------- Seçim, sayım ve sıralama ---------- */

export type Selection = Record<string, string[]>;
export type Extra = { min: string; max: string; inStock: boolean; sale: boolean };
export const NO_EXTRA: Extra = { min: '', max: '', inStock: false, sale: false };

const passes = (p: Product, f: Facet, chosen: string[] | undefined) => {
  if (!chosen?.length) return true;
  const v = f.values(p);
  return f.match === 'all' ? chosen.every((c) => v.includes(c)) : chosen.some((c) => v.includes(c));
};

const passesExtra = (p: Product, e: Extra) =>
  (!e.min || p.price >= Number(e.min)) && (!e.max || (p.price > 0 && p.price <= Number(e.max))) &&
  (!e.inStock || p.inStock) && (!e.sale || onSale(p));

export function applyFilters(products: Product[], facets: Facet[], sel: Selection, extra: Extra) {
  return products.filter((p) => passesExtra(p, extra) && facets.every((f) => passes(p, f, sel[f.key])));
}

// Her filtre için değerler ve sayıları; sayılar diğer filtreler uygulanmış haliyle hesaplanır.
// Tek değerli ve tüm ürünleri kapsayan filtre gizlenir (ör. tüm radyatörler 600 mm yükseklikte).
export function facetOptions(products: Product[], facets: Facet[], sel: Selection, extra: Extra) {
  return facets.map((f) => {
    const rest = products.filter((p) => passesExtra(p, extra) && facets.every((o) => o === f || passes(p, o, sel[o.key])));
    const all = new Map<string, number>(); // seçimle 0'a düşen değerler de listede kalır
    let covered = 0;
    for (const p of products) {
      const v = f.values(p);
      if (v.length) covered++;
      for (const x of v) all.set(x, 0);
    }
    for (const p of rest) for (const v of f.values(p)) all.set(v, (all.get(v) ?? 0) + 1);
    const values = [...all].sort(([a], [b]) => (f.rank ? f.rank(a) - f.rank(b) : 0) || a.localeCompare(b, 'tr'))
      .map(([value, count]) => ({ value, count }));
    const useful = values.length >= (f.minValues ?? 1) &&
      (values.length > 1 || (values.length === 1 && (covered < products.length || f.match === 'all')));
    return { facet: f, values, hidden: !useful };
  }).filter((o) => !o.hidden);
}

export const SORTS = [
  { key: 'onerilen', label: 'Önerilen', short: 'Sırala' },
  { key: 'fiyat-artan', label: 'Fiyat: Düşükten yükseğe', short: 'Fiyat artan' },
  { key: 'fiyat-azalan', label: 'Fiyat: Yüksekten düşüğe', short: 'Fiyat azalan' },
  { key: 'indirim', label: 'En yüksek indirim', short: 'İndirim' },
  { key: 'kapasite-artan', label: 'Kapasite: Küçükten büyüğe', short: 'Kapasite artan', capacity: true },
  { key: 'kapasite-azalan', label: 'Kapasite: Büyükten küçüğe', short: 'Kapasite azalan', capacity: true },
  { key: 'isim', label: 'Ürün adı (A–Z)', short: 'Ada göre' },
] as const;
export type SortKey = (typeof SORTS)[number]['key'];

// Kapasiteye göre sıralama yalnızca kapasitesi okunabilen bir kategori seçiliyken anlamlıdır (kW, BTU, mm karışmasın)
export const sortsFor = (category: string | null, products: Product[]) =>
  SORTS.filter((o) => !('capacity' in o) || (!!category && products.filter((p) => capacity(p) != null).length >= 2));

const discountOf = (p: Product) => (onSale(p) ? 1 - p.price / p.oldPrice! : 0);

// "Fiyat sorunuz" ürünleri ve kapasitesi okunamayanlar her sıralamada sonda kalır
export function sortProducts(list: Product[], key: SortKey) {
  const out = [...list];
  const last = (a: number | null, b: number | null, dir: 1 | -1) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : (a - b) * dir);
  const price = (p: Product) => (p.price > 0 ? p.price : null);
  switch (key) {
    case 'fiyat-artan': return out.sort((a, b) => last(price(a), price(b), 1));
    case 'fiyat-azalan': return out.sort((a, b) => last(price(a), price(b), -1));
    case 'indirim': return out.sort((a, b) => discountOf(b) - discountOf(a));
    case 'kapasite-artan': return out.sort((a, b) => last(capacity(a), capacity(b), 1) || last(price(a), price(b), 1));
    case 'kapasite-azalan': return out.sort((a, b) => last(capacity(a), capacity(b), -1) || last(price(a), price(b), 1));
    case 'isim': return out.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    default: return out.sort((a, b) => Number(b.inStock) - Number(a.inStock)); // stoktakiler önce, sitedeki sıra korunur
  }
}

export const selectedCount = (sel: Selection, extra: Extra) =>
  Object.values(sel).reduce((n, v) => n + v.length, 0) + (extra.min || extra.max ? 1 : 0) + Number(extra.inStock) + Number(extra.sale);
