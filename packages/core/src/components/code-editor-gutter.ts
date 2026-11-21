export interface FoldRange {
  startLine: number;
  endLine: number;
}

export interface CodeGutterOptions {
  lineCount: number;
  foldRanges?: readonly FoldRange[];
  initialBreakpoints?: readonly number[];
  onChange?: () => void;
}

export class CodeGutterController {
  private lineCount: number;
  private folds: readonly FoldRange[];
  private collapsedStarts = new Set<number>();
  private breakpointsSet: Set<number>;
  private activeLineNumber: number | null = null;
  private onChange?: () => void;

  constructor(options: CodeGutterOptions) {
    this.lineCount = Math.max(0, Math.trunc(options.lineCount));
    this.folds = options.foldRanges ?? [];
    this.breakpointsSet = new Set(options.initialBreakpoints ?? []);
    this.onChange = options.onChange;
  }

  get breakpoints(): number[] {
    return [...this.breakpointsSet].sort((a, b) => a - b);
  }

  get activeLine(): number | null {
    return this.activeLineNumber;
  }

  isFolded(startLine: number): boolean {
    return this.collapsedStarts.has(startLine);
  }

  toggleFold(startLine: number): void {
    if (!this.folds.some((f) => f.startLine === startLine)) return;
    if (this.collapsedStarts.has(startLine)) this.collapsedStarts.delete(startLine);
    else this.collapsedStarts.add(startLine);
    this.onChange?.();
  }

  toggleBreakpoint(line: number): void {
    if (line < 1 || line > this.lineCount) return;
    if (this.breakpointsSet.has(line)) this.breakpointsSet.delete(line);
    else this.breakpointsSet.add(line);
    this.onChange?.();
  }

  setActiveLine(line: number | null): void {
    this.activeLineNumber = line;
    this.onChange?.();
  }

  getVisibleLines(): number[] {
    const hidden = new Set<number>();
    for (const f of this.folds) {
      if (this.collapsedStarts.has(f.startLine)) {
        for (let l = f.startLine + 1; l <= f.endLine; l += 1) hidden.add(l);
      }
    }
    const visible: number[] = [];
    for (let l = 1; l <= this.lineCount; l += 1) if (!hidden.has(l)) visible.push(l);
    return visible;
  }

  destroy(): void {
    this.collapsedStarts.clear();
  }
}

export function createCodeGutterController(options: CodeGutterOptions): CodeGutterController {
  return new CodeGutterController(options);
}
