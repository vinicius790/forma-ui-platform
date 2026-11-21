import { getOwnerDocument } from './dom.js';

const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE']);
const counterMap = new WeakMap<Element, number>();
const previousAriaHiddenMap = new WeakMap<Element, string | null>();

/**
 * Oculta árvores DOM irmãs de leitores de tela (aria-hidden="true") enquanto um
 * Dialog ou AlertDialog modal está aberto, restaurando o estado exato ao fechar.
 */
export function ariaHideOutside(
  targets: HTMLElement[],
  root?: HTMLElement
): () => void {
  const firstTarget = targets[0];
  if (!firstTarget) return () => {};

  const doc = getOwnerDocument(firstTarget);
  const container = root ?? doc.body;
  if (!container) return () => {};

  const keepVisible = new Set<Node>();
  for (const target of targets) {
    let current: Node | null = target;
    while (current && current !== container) {
      keepVisible.add(current);
      current = current.parentNode;
    }
  }

  const hiddenElements: Element[] = [];

  const walk = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      if (IGNORED_TAGS.has(child.tagName)) continue;
      if (child.hasAttribute('data-forma-live-region')) continue;

      if (targets.includes(child as HTMLElement)) {
        continue;
      }

      if (keepVisible.has(child)) {
        walk(child);
        continue;
      }

      const count = counterMap.get(child) ?? 0;
      if (count === 0) {
        previousAriaHiddenMap.set(child, child.getAttribute('aria-hidden'));
        child.setAttribute('aria-hidden', 'true');
        child.setAttribute('data-forma-aria-hidden', '');
      }
      counterMap.set(child, count + 1);
      hiddenElements.push(child);
    }
  };

  walk(container);

  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    for (const el of hiddenElements) {
      const count = (counterMap.get(el) ?? 1) - 1;
      if (count <= 0) {
        counterMap.delete(el);
        const prev = previousAriaHiddenMap.get(el);
        if (prev === null || prev === undefined) {
          el.removeAttribute('aria-hidden');
        } else {
          el.setAttribute('aria-hidden', prev);
        }
        el.removeAttribute('data-forma-aria-hidden');
        previousAriaHiddenMap.delete(el);
      } else {
        counterMap.set(el, count);
      }
    }
  };
}
