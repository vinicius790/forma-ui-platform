export type DiffLineKind = 'unchanged' | 'added' | 'removed';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
  oldLine: number | null;
  newLine: number | null;
}

export interface DiffViewerOptions {
  original: string;
  modified: string;
  viewMode?: 'unified' | 'split';
}

/** Deterministic LCS line diff algorithm for headless code/text review UIs. */
export function computeLineDiff(original: string, modified: string): DiffLine[] {
  const a = original === '' ? [] : original.split(/\r?\n/u);
  const b = modified === '' ? [] : modified.split(/\r?\n/u);
  const m = a.length;
  const n = b.length;
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ kind: 'unchanged', text: a[i]!, oldLine: i + 1, newLine: j + 1 });
      i += 1;
      j += 1;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      out.push({ kind: 'removed', text: a[i]!, oldLine: i + 1, newLine: null });
      i += 1;
    } else {
      out.push({ kind: 'added', text: b[j]!, oldLine: null, newLine: j + 1 });
      j += 1;
    }
  }
  while (i < m) { out.push({ kind: 'removed', text: a[i]!, oldLine: i + 1, newLine: null }); i += 1; }
  while (j < n) { out.push({ kind: 'added', text: b[j]!, oldLine: null, newLine: j + 1 }); j += 1; }
  return out;
}

export class DiffViewerController {
  private linesList: DiffLine[];
  private mode: 'unified' | 'split';
  private activeChangeIdx = 0;
  private changeIndices: number[];

  constructor(options: DiffViewerOptions) {
    this.mode = options.viewMode ?? 'unified';
    this.linesList = computeLineDiff(options.original, options.modified);
    this.changeIndices = this.linesList.reduce<number[]>((acc, l, idx) => {
      if (l.kind !== 'unchanged') acc.push(idx);
      return acc;
    }, []);
  }

  get lines(): readonly DiffLine[] {
    return this.linesList;
  }

  get viewMode(): 'unified' | 'split' {
    return this.mode;
  }

  get stats(): { added: number; removed: number; unchanged: number } {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    for (const l of this.linesList) {
      if (l.kind === 'added') added += 1;
      else if (l.kind === 'removed') removed += 1;
      else unchanged += 1;
    }
    return { added, removed, unchanged };
  }

  setViewMode(mode: 'unified' | 'split'): void {
    this.mode = mode;
  }

  nextChangeLineIndex(): number {
    if (!this.changeIndices.length) return -1;
    this.activeChangeIdx = (this.activeChangeIdx + 1) % this.changeIndices.length;
    return this.changeIndices[this.activeChangeIdx]!;
  }

  prevChangeLineIndex(): number {
    if (!this.changeIndices.length) return -1;
    this.activeChangeIdx = (this.activeChangeIdx - 1 + this.changeIndices.length) % this.changeIndices.length;
    return this.changeIndices[this.activeChangeIdx]!;
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createDiffViewerController(options: DiffViewerOptions): DiffViewerController {
  return new DiffViewerController(options);
}
