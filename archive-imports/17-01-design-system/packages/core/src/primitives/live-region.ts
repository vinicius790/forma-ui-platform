import { isBrowser } from './dom.js';

export type LivePoliteness = 'polite' | 'assertive';

let politeNode: HTMLElement | null = null;
let assertiveNode: HTMLElement | null = null;

function ensureLiveNode(politeness: LivePoliteness): HTMLElement | null {
  if (!isBrowser()) return null;
  const existing = politeness === 'assertive' ? assertiveNode : politeNode;
  if (existing && existing.isConnected) return existing;

  const node = document.createElement('div');
  node.setAttribute('data-forma-live-region', politeness);
  node.setAttribute('aria-live', politeness);
  node.setAttribute('aria-atomic', 'true');
  node.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
  Object.assign(node.style, {
    position: 'fixed',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
  });

  document.body.appendChild(node);
  if (politeness === 'assertive') {
    assertiveNode = node;
  } else {
    politeNode = node;
  }
  return node;
}

export function announce(message: string, politeness: LivePoliteness = 'polite'): void {
  const node = ensureLiveNode(politeness);
  if (!node) return;
  node.textContent = '';
  // Force screen reader re-announcement on identical consecutive messages
  queueMicrotask(() => {
    if (node) node.textContent = message;
  });
}

export function cleanupLiveRegions(): void {
  politeNode?.remove();
  assertiveNode?.remove();
  politeNode = null;
  assertiveNode = null;
}
