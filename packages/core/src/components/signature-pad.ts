import { createId } from '../primitives/id';
import { createHistoryStack, type HistoryStack } from '../primitives/undo-redo';

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export type SignatureStroke = readonly StrokePoint[];

export interface SignaturePadOptions {
  id?: string;
  minDistance?: number;
  disabled?: boolean;
  onStrokesChange?: (strokes: readonly SignatureStroke[]) => void;
}

export class SignaturePadController {
  private options: SignaturePadOptions;
  private history: HistoryStack<readonly SignatureStroke[]>;
  private activeStroke: StrokePoint[] | null = null;
  readonly baseId: string;

  constructor(options: SignaturePadOptions = {}) {
    this.options = { minDistance: 2, ...options };
    this.history = createHistoryStack<readonly SignatureStroke[]>([], { capacity: 100 });
    this.baseId = options.id ?? createId('forma-signature');
  }

  get strokes(): readonly SignatureStroke[] {
    return this.activeStroke ? [...this.history.present, this.activeStroke] : this.history.present;
  }

  get isEmpty(): boolean {
    return this.strokes.length === 0;
  }

  get canUndo(): boolean {
    return this.history.canUndo;
  }

  get canRedo(): boolean {
    return this.history.canRedo;
  }

  beginStroke(point: StrokePoint): void {
    if (this.options.disabled) return;
    this.activeStroke = [{ ...point }];
  }

  appendPoint(point: StrokePoint): void {
    if (this.options.disabled || !this.activeStroke) return;
    const last = this.activeStroke[this.activeStroke.length - 1];
    const minDist = this.options.minDistance ?? 2;
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < minDist) return;
    this.activeStroke.push({ ...point });
  }

  endStroke(): void {
    if (!this.activeStroke) return;
    const completed = [...this.activeStroke];
    this.activeStroke = null;
    if (completed.length > 0) {
      const next = [...this.history.present, completed];
      this.history.push(next);
      this.options.onStrokesChange?.(next);
    }
  }

  undo(): void {
    if (!this.history.canUndo) return;
    const next = this.history.undo();
    this.options.onStrokesChange?.(next);
  }

  redo(): void {
    if (!this.history.canRedo) return;
    const next = this.history.redo();
    this.options.onStrokesChange?.(next);
  }

  clear(): void {
    this.activeStroke = null;
    this.history.push([]);
    this.options.onStrokesChange?.([]);
  }

  /** Serializes all strokes into a smooth quadratic-Bezier SVG path string. */
  toSvgPath(): string {
    const segments: string[] = [];
    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;
      const first = stroke[0]!;
      if (stroke.length === 1) {
        segments.push(`M ${first.x} ${first.y} L ${first.x + 0.01} ${first.y}`);
        continue;
      }
      let d = `M ${first.x} ${first.y}`;
      for (let i = 1; i < stroke.length - 1; i += 1) {
        const curr = stroke[i]!;
        const next = stroke[i + 1]!;
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        d += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
      }
      const last = stroke[stroke.length - 1]!;
      d += ` L ${last.x} ${last.y}`;
      segments.push(d);
    }
    return segments.join(' ');
  }

  getSurfaceProps(label = 'Signature pad') {
    return {
      id: this.baseId,
      role: 'application' as const,
      'aria-label': label,
      'aria-disabled': this.options.disabled || undefined,
      'data-empty': this.isEmpty ? 'true' : 'false',
    };
  }

  destroy(): void {
    this.activeStroke = null;
  }
}

export function createSignaturePadController(options: SignaturePadOptions = {}): SignaturePadController {
  return new SignaturePadController(options);
}
