import { useEffect, useState } from 'react';
import { API_URL, absolute } from './api';

// target: "" | "kampanyalar" | "kategori:<ad>" | site adresi (admin → Mobil Uygulama → Ana Sayfa Bannerları)
export type Banner = { id: string; image: string; eyebrow: string; title: string; text: string; target: string };

// Ana sayfa bannerları: admin'deki uygulama bannerları (yoksa sitenin slider görselleri). Gelmezse uygulamanın kendi bannerları gösterilir.
export function useSlides() {
  const [slides, setSlides] = useState<Banner[]>([]);
  useEffect(() => {
    if (!API_URL) return;
    let alive = true;
    fetch(`${API_URL}/api/slides`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: (Banner & { url?: string | null })[]) =>
        alive && setSlides(rows.map((r) => ({ ...r, image: absolute(r.image)!, target: r.target ?? r.url ?? '' })).filter((r) => r.image)))
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return slides;
}
