// Web sitesinin adresi (.env → EXPO_PUBLIC_API_URL). Veritabanı şifresi uygulamada TUTULMAZ.
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Site görselleri "/uploads/..." gibi göreli adres döndürür; uygulamada tam adrese çevrilir
export const absolute = (url: string | null) => (url ? (/^https?:/.test(url) ? url : `${API_URL}${url}`) : null);
