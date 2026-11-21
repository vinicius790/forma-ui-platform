import { createId } from '../primitives/id';

export interface TimelineItem {
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface TimelineOptions {
  id?: string;
  items: readonly TimelineItem[];
  minTime: number;
  maxTime: number;
  playhead?: number;
  zoom?: number;
  step?: number;
  onPlayheadChange?: (time: number) => void;
  onSelectChange?: (itemId: string | null) => void;
}

export class TimelineController {
  private options: TimelineOptions;
  private currentPlayhead: number;
  private currentZoom: number;
  private selectedId: string | null = null;
  readonly baseId: string;

  constructor(options: TimelineOptions) {
    this.options = { step: 1, ...options };
    this.currentPlayhead = this.clampTime(options.playhead ?? options.minTime);
    this.currentZoom = Math.max(0.25, Math.min(32, options.zoom ?? 1));
    this.baseId = options.id ?? createId('forma-timeline');
  }

  get playhead(): number {
    return this.currentPlayhead;
  }

  get zoom(): number {
    return this.currentZoom;
  }

  get selectedItemId(): string | null {
    return this.selectedId;
  }

  private clampTime(t: number): number {
    return Math.min(this.options.maxTime, Math.max(this.options.minTime, t));
  }

  setPlayhead(time: number): void {
    const next = this.clampTime(time);
    if (next === this.currentPlayhead) return;
    this.currentPlayhead = next;
    this.options.onPlayheadChange?.(next);
  }

  setZoom(nextZoom: number): void {
    this.currentZoom = Math.max(0.25, Math.min(32, nextZoom));
  }

  selectItem(id: string | null): void {
    if (id === this.selectedId) return;
    this.selectedId = id;
    this.options.onSelectChange?.(id);
  }

  /** Converts a timestamp into a percentage [0..100] across the timeline span. */
  timeToPercent(time: number): number {
    const span = Math.max(1e-6, this.options.maxTime - this.options.minTime);
    return ((this.clampTime(time) - this.options.minTime) / span) * 100;
  }

  getPlayheadProps() {
    const step = this.options.step ?? 1;
    return {
      id: `${this.baseId}-playhead`,
      role: 'slider' as const,
      tabIndex: 0,
      'aria-label': 'Timeline playhead',
      'aria-valuemin': this.options.minTime,
      'aria-valuemax': this.options.maxTime,
      'aria-valuenow': this.currentPlayhead,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'>) => {
        const delta = e.shiftKey ? step * 10 : step;
        if (e.key === 'ArrowRight') { e.preventDefault(); this.setPlayhead(this.currentPlayhead + delta); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.setPlayhead(this.currentPlayhead - delta); }
        else if (e.key === 'Home') { e.preventDefault(); this.setPlayhead(this.options.minTime); }
        else if (e.key === 'End') { e.preventDefault(); this.setPlayhead(this.options.maxTime); }
      },
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createTimelineController(options: TimelineOptions): TimelineController {
  return new TimelineController(options);
}
