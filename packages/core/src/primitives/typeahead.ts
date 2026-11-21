export function normalizeSearchText(value: string, locale?: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale).trim();
}

export class Typeahead {
  private buffer = '';
  private lastTime = 0;
  constructor(private readonly timeout = 700, private readonly now = () => Date.now()) {}

  push(key: string, options: readonly string[], currentIndex = -1, locale?: string): number {
    if (Array.from(key).length !== 1 || /\s/u.test(key)) return -1;
    const currentTime = this.now();
    this.buffer = currentTime - this.lastTime > this.timeout ? key : this.buffer + key;
    this.lastTime = currentTime;
    const normalized = normalizeSearchText(this.buffer, locale);
    const repeated = [...normalized].every((char) => char === normalized[0]);
    const query = repeated ? normalized[0] ?? '' : normalized;
    for (let offset = 1; offset <= options.length; offset += 1) {
      const index = (currentIndex + offset + options.length) % options.length;
      if (normalizeSearchText(options[index] ?? '', locale).startsWith(query)) return index;
    }
    return -1;
  }

  reset(): void { this.buffer = ''; this.lastTime = 0; }
  get value(): string { return this.buffer; }
}
