/** Lightweight headless spreadsheet formula engine supporting SUM, AVG, MIN, MAX, COUNT, and A1:B5 ranges with cycle detection. */
export class SpreadsheetFormulaEngine {
  private cells = new Map<string, string | number>();

  setCell(ref: string, raw: string | number): void {
    this.cells.set(ref.toUpperCase(), raw);
  }

  getRaw(ref: string): string | number | undefined {
    return this.cells.get(ref.toUpperCase());
  }

  private expandRange(range: string): string[] {
    const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/u.exec(range.trim().toUpperCase());
    if (!match) return [range.trim().toUpperCase()];
    const c1 = match[1]!.charCodeAt(0);
    const r1 = Number(match[2]);
    const c2 = match[3]!.charCodeAt(0);
    const r2 = Number(match[4]);
    const refs: string[] = [];
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c += 1) {
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r += 1) {
        refs.push(`${String.fromCharCode(c)}${r}`);
      }
    }
    return refs;
  }

  evaluate(ref: string, visiting = new Set<string>()): number {
    const key = ref.toUpperCase();
    if (visiting.has(key)) throw new Error(`Circular formula reference: ${key}`);
    const raw = this.cells.get(key);
    if (raw === undefined) return 0;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
    const trimmed = raw.trim();
    if (!trimmed.startsWith('=')) {
      const num = Number(trimmed);
      return Number.isFinite(num) ? num : 0;
    }
    visiting.add(key);
    try {
      const expr = trimmed.slice(1).trim();
      const fnMatch = /^(SUM|AVG|MIN|MAX|COUNT)\(([^)]+)\)$/iu.exec(expr);
      if (fnMatch) {
        const fn = fnMatch[1]!.toUpperCase();
        const args = fnMatch[2]!.split(',').flatMap((part) => this.expandRange(part));
        const nums = args.map((arg) => (/^[A-Z]+\d+$/u.test(arg) ? this.evaluate(arg, visiting) : Number(arg))).filter((n) => Number.isFinite(n));
        if (fn === 'COUNT') return nums.length;
        if (nums.length === 0) return 0;
        if (fn === 'SUM') return nums.reduce((a, b) => a + b, 0);
        if (fn === 'AVG') return nums.reduce((a, b) => a + b, 0) / nums.length;
        if (fn === 'MIN') return Math.min(...nums);
        return Math.max(...nums);
      }
      if (/^[A-Z]+\d+$/iu.test(expr)) return this.evaluate(expr, visiting);
      const num = Number(expr);
      return Number.isFinite(num) ? num : 0;
    } finally {
      visiting.delete(key);
    }
  }

  destroy(): void { this.cells.clear(); }
}

export function createSpreadsheetFormulaEngine(): SpreadsheetFormulaEngine {
  return new SpreadsheetFormulaEngine();
}
