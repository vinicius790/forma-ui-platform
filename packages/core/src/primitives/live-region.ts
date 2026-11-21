export type LivePriority = 'polite' | 'assertive';
export class LiveRegion {
  private node: HTMLElement | null = null;
  constructor(private readonly priority: LivePriority = 'polite', private readonly doc: Document | undefined = typeof document === 'undefined' ? undefined : document) {}
  mount(): HTMLElement | null {
    if (!this.doc) return null;
    if (this.node?.isConnected) return this.node;
    const node = this.doc.createElement('div'); node.setAttribute('role', this.priority === 'assertive' ? 'alert' : 'status'); node.setAttribute('aria-live', this.priority); node.setAttribute('aria-atomic', 'true');
    Object.assign(node.style, { position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: '0' });
    this.doc.body.append(node); this.node = node; return node;
  }
  announce(message: string): void { const node = this.mount(); if (!node) return; node.textContent = ''; queueMicrotask(() => { if (node.isConnected) node.textContent = message; }); }
  destroy(): void { this.node?.remove(); this.node = null; }
}
