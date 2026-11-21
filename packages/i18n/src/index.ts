const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv']);

export function detectLocaleDirection(locale: string): 'ltr' | 'rtl' {
  const primary = locale.trim().toLowerCase().split(/[-_]/u)[0] ?? 'en';
  return RTL_LANGS.has(primary) ? 'rtl' : 'ltr';
}

export function formatIcuMessage(template: string, params: Readonly<Record<string, string | number>> = {}, locale = 'en-US'): string {
  const pluralReplaced = template.replace(/\{(\w+),\s*plural,\s*([\s\S]+)\}/gu, (_m, key: string, body: string) => {
    const count = Number(params[key] ?? 0);
    const rules = new Intl.PluralRules(locale);
    const cat = count === 0 && /=0\s*\{/u.test(body) ? '=0' : rules.select(count);
    const exactMatch = new RegExp(`(?:^|\\s)${cat}\\s*\\{([^}]*)\\}`, 'u').exec(body) ?? /other\s*\{([^}]*)\}/u.exec(body);
    const text = exactMatch?.[1] ?? '';
    return text.replace(/#/gu, count.toLocaleString(locale));
  });
  return pluralReplaced.replace(/\{(\w+)\}/gu, (_m, key: string) => String(params[key] ?? `{${key}}`));
}

export class LocaleCatalog<Messages extends Record<string, string> = Record<string, string>> {
  private currentLocale: string;
  private dictionaries: Record<string, Messages>;
  constructor(initialLocale: string, dictionaries: Record<string, Messages>) {
    this.currentLocale = initialLocale;
    this.dictionaries = { ...dictionaries };
  }
  get locale(): string { return this.currentLocale; }
  get direction(): 'ltr' | 'rtl' { return detectLocaleDirection(this.currentLocale); }
  setLocale(locale: string): void { this.currentLocale = locale; }
  t(key: keyof Messages & string, params?: Readonly<Record<string, string | number>>): string {
    const dict = this.dictionaries[this.currentLocale] ?? Object.values(this.dictionaries)[0];
    const raw = dict?.[key] ?? key;
    return formatIcuMessage(raw, params, this.currentLocale);
  }
}

export function createLocaleCatalog<Messages extends Record<string, string>>(initialLocale: string, dictionaries: Record<string, Messages>): LocaleCatalog<Messages> {
  return new LocaleCatalog(initialLocale, dictionaries);
}
