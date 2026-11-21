export interface AvatarOptions { src?: string; alt?: string; loading?: 'eager' | 'lazy'; crossOrigin?: HTMLImageElement['crossOrigin']; onLoad?: () => void; onError?: () => void }
export type AvatarImageState = 'loading' | 'loaded' | 'error' | 'empty';
export class AvatarController {
  private options: AvatarOptions;
  private state: AvatarImageState;
  constructor(options: AvatarOptions = {}) { this.options = { loading: 'eager', ...options }; this.state = options.src ? 'loading' : 'empty'; }
  get imageState(): AvatarImageState { return this.state; }
  updateOptions(options: Partial<AvatarOptions>): void {
    const previous = this.options.src;
    this.options = { ...this.options, ...options };
    if (Object.hasOwn(options, 'src') && options.src !== previous) this.state = options.src ? 'loading' : 'empty';
  }
  imageLoaded(): void { if (this.state !== 'loading') return; this.state = 'loaded'; this.options.onLoad?.(); }
  imageFailed(): void { if (this.state !== 'loading') return; this.state = 'error'; this.options.onError?.(); }
  getImageProps() { return { src: this.options.src, alt: this.options.alt ?? '', loading: this.options.loading, crossOrigin: this.options.crossOrigin, hidden: this.state !== 'loaded', 'data-state': this.state, onLoad: () => this.imageLoaded(), onError: () => this.imageFailed() }; }
  getFallbackProps() { return { 'aria-hidden': this.state === 'loaded' || undefined, hidden: this.state === 'loaded', 'data-state': this.state }; }
}
export function createAvatarController(options: AvatarOptions = {}): AvatarController { return new AvatarController(options); }
