import { createId } from '../primitives/id';

export interface QrCodeOptions {
  id?: string;
  value: string;
  size?: number;
  label?: string;
  onValueChange?: (value: string) => void;
}

function setFinder(grid: boolean[][], row: number, col: number): void {
  for (let r = 0; r < 7; r += 1) {
    for (let c = 0; c < 7; c += 1) {
      const border = r === 0 || r === 6 || c === 0 || c === 6;
      const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[row + r]![col + c] = border || center;
    }
  }
}

/**
 * Generates a deterministic 21x21 structured visual matrix with standard finder/timing geometry
 * and payload bit distribution for headless SVG/Canvas QR-style rendering.
 */
export function buildQrVisualMatrix(payload: string, dimension = 21): boolean[][] {
  const n = Math.max(21, Math.trunc(dimension));
  const grid: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
  setFinder(grid, 0, 0);
  setFinder(grid, 0, n - 7);
  setFinder(grid, n - 7, 0);
  for (let i = 8; i < n - 8; i += 1) {
    grid[6]![i] = i % 2 === 0;
    grid[i]![6] = i % 2 === 0;
  }
  const bytes = Array.from(payload).map((ch) => ch.codePointAt(0) ?? 0);
  let bitIndex = 0;
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= n - 8;
      const inBottomLeft = r >= n - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft || r === 6 || c === 6) continue;
      const byte = bytes.length ? bytes[bitIndex % bytes.length]! : 0;
      const bit = ((byte >> (bitIndex % 8)) ^ ((r + c) & 1)) & 1;
      grid[r]![c] = bit === 1;
      bitIndex += 1;
    }
  }
  return grid;
}

export function matrixToSvgPath(matrix: readonly (readonly boolean[])[]): string {
  const parts: string[] = [];
  for (let r = 0; r < matrix.length; r += 1) {
    const row = matrix[r]!;
    for (let c = 0; c < row.length; c += 1) {
      if (row[c]) parts.push(`M${c},${r}h1v1h-1z`);
    }
  }
  return parts.join('');
}

export class QrCodeController {
  private options: QrCodeOptions;
  readonly baseId: string;

  constructor(options: QrCodeOptions) {
    this.options = { size: 21, ...options };
    this.baseId = options.id ?? createId('forma-qr');
  }

  get value(): string {
    return this.options.value;
  }

  get size(): number {
    return Math.max(21, Math.trunc(this.options.size ?? 21));
  }

  get matrix(): boolean[][] {
    return buildQrVisualMatrix(this.options.value, this.size);
  }

  setValue(next: string): void {
    if (next === this.options.value) return;
    this.options = { ...this.options, value: next };
    this.options.onValueChange?.(next);
  }

  getSvgProps() {
    const m = this.matrix;
    return {
      id: this.baseId,
      role: 'img' as const,
      'aria-label': this.options.label ?? `QR code for ${this.options.value}`,
      viewBox: `0 0 ${m.length} ${m.length}`,
      path: matrixToSvgPath(m),
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createQrCodeController(options: QrCodeOptions): QrCodeController {
  return new QrCodeController(options);
}
