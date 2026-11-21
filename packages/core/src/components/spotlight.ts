export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface SpatialCanvasOptions {
  minZoom?: number;
  maxZoom?: number;
  panStep?: number;
  initial?: Partial<ViewportTransform>;
  onTransformChange?: (transform: ViewportTransform) => void;
}

export class SpatialCanvasController {
  private options: SpatialCanvasOptions;
  private state: ViewportTransform;

  constructor(options: SpatialCanvasOptions = {}) {
    this.options = { minZoom: 0.1, maxZoom: 8, panStep: 40, ...options };
    this.state = { x: options.initial?.x ?? 0, y: options.initial?.y ?? 0, zoom: this.clampZoom(options.initial?.zoom ?? 1) };
  }

  get transform(): ViewportTransform {
    return { ...this.state };
  }

  private clampZoom(z: number): number {
    return Math.min(this.options.maxZoom ?? 8, Math.max(this.options.minZoom ?? 0.1, z));
  }

  private commit(next: ViewportTransform): void {
    this.state = next;
    this.options.onTransformChange?.(this.transform);
  }

  panBy(dx: number, dy: number): void {
    this.commit({ ...this.state, x: this.state.x + dx, y: this.state.y + dy });
  }

  zoomAt(factor: number, focalX = 0, focalY = 0): void {
    const nextZoom = this.clampZoom(this.state.zoom * factor);
    const scale = nextZoom / this.state.zoom;
    const nextX = focalX - (focalX - this.state.x) * scale;
    const nextY = focalY - (focalY - this.state.y) * scale;
    this.commit({ x: nextX, y: nextY, zoom: nextZoom });
  }

  reset(): void {
    this.commit({ x: 0, y: 0, zoom: 1 });
  }

  getCanvasProps(label = 'Interactive canvas') {
    const step = this.options.panStep ?? 40;
    return {
      role: 'application' as const,
      tabIndex: 0,
      'aria-label': label,
      'data-zoom': this.state.zoom.toFixed(2),
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomAt(1.2); }
        else if (e.key === '-') { e.preventDefault(); this.zoomAt(1 / 1.2); }
        else if (e.key === '0') { e.preventDefault(); this.reset(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); this.panBy(-step, 0); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.panBy(step, 0); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); this.panBy(0, -step); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.panBy(0, step); }
      },
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createSpatialCanvasController(options: SpatialCanvasOptions = {}): SpatialCanvasController {
  return new SpatialCanvasController(options);
}
