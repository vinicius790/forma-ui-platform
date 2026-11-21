import { isElement, isShadowRoot } from './dom';

interface OriginalState {
  ariaHidden: string | null;
  inert: boolean;
}

interface ModalTreeState {
  stack: HTMLElement[];
  originalStates: Map<HTMLElement, OriginalState>;
  observers: MutationObserver[];
  observedRoots: WeakSet<Node>;
  refresh: () => void;
}

const statesByDocument = new WeakMap<Document, ModalTreeState>();
const SKIPPED_NON_CONTENT_TAGS = new Set(['STYLE', 'SCRIPT', 'LINK']);

function restore(state: ModalTreeState): void {
  for (const [element, original] of state.originalStates) {
    if (original.ariaHidden === null) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', original.ariaHidden);
    element.inert = original.inert;
  }
  state.originalStates.clear();
}

function hide(element: HTMLElement, state: ModalTreeState): void {
  if (!state.originalStates.has(element)) {
    state.originalStates.set(element, {
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: Boolean(element.inert),
    });
  }
  element.setAttribute('aria-hidden', 'true');
  element.inert = true;
}

function isConnectedToBody(node: Node, body: HTMLElement | null): boolean {
  if (!body) return false;
  if (body.contains(node)) return true;
  let current: Node | null = node;
  let depth = 0;
  while (current && depth < 1024) {
    if (current === body) return true;
    current = isShadowRoot(current) ? current.host : current.parentNode;
    depth += 1;
  }
  return false;
}

function observeRootIfNeeded(state: ModalTreeState, root: Node, doc: Document): void {
  if (state.observedRoots.has(root)) return;
  const Observer = doc.defaultView?.MutationObserver;
  if (!Observer) return;
  const observer = new Observer(() => state.refresh());
  observer.observe(root, { childList: true, subtree: true });
  state.observedRoots.add(root);
  state.observers.push(observer);
}

function refresh(state: ModalTreeState, doc: Document): void {
  restore(state);
  const modal = state.stack.at(-1);
  if (!modal || !isConnectedToBody(modal, doc.body)) return;

  let branch: Node = modal;
  let parent: Node | null = branch.parentNode;
  while (parent) {
    if (parent === doc.body || isElement(parent) || isShadowRoot(parent)) {
      if (isShadowRoot(parent)) {
        observeRootIfNeeded(state, parent, doc);
      }
      for (const sibling of [...(parent as ParentNode).children]) {
        if (
          sibling !== branch &&
          sibling.nodeType === 1 &&
          !SKIPPED_NON_CONTENT_TAGS.has(sibling.tagName)
        ) {
          hide(sibling as HTMLElement, state);
        }
      }
    }
    if (parent === doc.body) break;
    if (isShadowRoot(parent)) {
      branch = parent.host;
      parent = branch.parentNode;
    } else {
      branch = parent;
      parent = branch.parentNode;
    }
  }
}

/**
 * Makes everything outside the topmost modal inert and hidden from assistive
 * technology. Supports nested portals, Shadow DOM trees, and restores original state.
 */
export function ariaHideOutside(modal: HTMLElement): () => void {
  const doc = modal.ownerDocument;
  let state = statesByDocument.get(doc);

  if (!state) {
    const created: ModalTreeState = {
      stack: [],
      originalStates: new Map(),
      observers: [],
      observedRoots: new WeakSet(),
      refresh: () => undefined,
    };
    created.refresh = () => refresh(created, doc);
    if (doc.body) {
      observeRootIfNeeded(created, doc.body, doc);
    }
    state = created;
    statesByDocument.set(doc, state);
  }

  state.stack.push(modal);
  state.refresh();
  let active = true;

  return () => {
    if (!active) return;
    active = false;
    const current = statesByDocument.get(doc);
    if (!current) return;

    const index = current.stack.lastIndexOf(modal);
    if (index >= 0) current.stack.splice(index, 1);

    if (current.stack.length === 0) {
      for (const observer of current.observers) {
        observer.disconnect();
      }
      current.observers = [];
      restore(current);
      statesByDocument.delete(doc);
    } else {
      current.refresh();
    }
  };
}
