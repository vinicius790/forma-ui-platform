export interface UrlStateCodec<T extends Record<string, string | number | boolean>> {
  encode(state: Partial<T>): string;
  decode(search: string): T;
}

/** SSR-safe typed URLSearchParams codec for synchronizing filters, pagination, tabs, and sorting with the URL. */
export function createUrlStateCodec<T extends Record<string, string | number | boolean>>(
  defaults: T,
  prefix = '',
): UrlStateCodec<T> {
  return {
    encode(state) {
      const params = new URLSearchParams();
      for (const [key, defVal] of Object.entries(defaults)) {
        const val = state[key as keyof T] ?? defVal;
        if (val !== defVal) params.set(`${prefix}${key}`, String(val));
      }
      const str = params.toString();
      return str ? `?${str}` : '';
    },
    decode(search) {
      const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
      const out = { ...defaults };
      for (const [key, defVal] of Object.entries(defaults)) {
        const raw = params.get(`${prefix}${key}`);
        if (raw === null) continue;
        if (typeof defVal === 'boolean') (out as Record<string, unknown>)[key] = raw === 'true' || raw === '1';
        else if (typeof defVal === 'number') {
          const num = Number(raw);
          if (Number.isFinite(num)) (out as Record<string, unknown>)[key] = num;
        } else {
          (out as Record<string, unknown>)[key] = raw;
        }
      }
      return out;
    },
  };
}
