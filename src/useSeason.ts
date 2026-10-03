import { create } from 'zustand';
import { API_URL } from './api';

// Mevsime göre kategori sırası (sitedeki admin → Mevsim Sıralaması ile aynı).
// Sunucuya ulaşılamazsa takvime göre yerel sıra kullanılır: Eylül–Mart ısıtma, Nisan–Ağustos soğutma.
const LOCAL = {
  isitma: ['Kombi', 'Radyatör', 'Isı Pompası', 'Oda Termostatı', 'Sirkülasyon Pompası', 'Şofben', 'Klima'],
  sogutma: ['Klima', 'Isı Pompası', 'Şofben', 'Kombi', 'Radyatör', 'Oda Termostatı', 'Sirkülasyon Pompası'],
};
const month = new Date().getMonth() + 1;
const localSeason = month >= 4 && month <= 8 ? 'sogutma' : 'isitma';

type SeasonState = { season: 'isitma' | 'sogutma'; order: string[] };
export const useSeason = create<SeasonState>(() => ({ season: localSeason, order: LOCAL[localSeason] }));

let loaded = false;
export function loadSeason() {
  if (loaded || !API_URL) return;
  loaded = true;
  fetch(`${API_URL}/api/app/season`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { if (d && Array.isArray(d.order)) useSeason.setState({ season: d.season, order: d.order }); })
    .catch(() => { loaded = false; });
}

// Başlıklarda kullanılan çoğul adlar
const PLURAL: Record<string, string> = {
  Kombi: 'Kombiler', Klima: 'Klimalar', Radyatör: 'Radyatörler', 'Isı Pompası': 'Isı Pompaları',
  'Oda Termostatı': 'Oda Termostatları', 'Sirkülasyon Pompası': 'Sirkülasyon Pompaları', Şofben: 'Şofbenler',
};
export const plural = (c: string) => PLURAL[c] ?? c;
