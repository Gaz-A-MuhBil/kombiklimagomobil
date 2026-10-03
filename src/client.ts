import { API_URL } from './api';

// Sitedeki uygulama API'sine istek atar; hata olursa sunucunun Türkçe mesajıyla Error fırlatır
export async function api<T>(path: string, opts: { method?: 'GET' | 'POST'; body?: unknown; token?: string | null } = {}): Promise<T> {
  if (!API_URL) throw new Error('Sunucu adresi tanımlı değil.');
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers: {
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new Error('İnternet bağlantınızı kontrol edip tekrar deneyin.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Bir sorun oluştu. Lütfen tekrar deneyin.'), { status: res.status });
  return data as T;
}
