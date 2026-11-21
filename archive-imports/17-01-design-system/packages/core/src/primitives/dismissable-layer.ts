import { containsElement, getOwnerDocument } from './dom.js';

export interface DismissableLayerOptions {
  element: () => HTMLElement | null;
  ignoredElements?: () => Array<HTMLElement | null>;
  onDismiss: (reason: 'escape' | 'pointer-outside') => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

export interface DismissableLayerController {
  activate: () => void;
  deactivate: () => void;
}

const layerStack: DismissableLayerController[] = [];

export function createDismissableLayer(
  options: DismissableLayerOptions
): DismissableLayerController {
  const {
    element,
    ignoredElements,
    onDismiss,
    closeOnEscape = true,
    closeOnOutsideClick = true
  } = options;
  let active = false;

  const isTopmost = () => layerStack[layerStack.length - 1] === controller;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!active || !isTopmost()) return;
    if (closeOnEscape && event.key === 'Escape') {
      event.stopPropagation();
      onDismiss('escape');
    }
  };

  const handlePointerDown = (event: PointerEvent | MouseEvent) => {
    if (!active || !isTopmost() || !closeOnOutsideClick) return;
    const target = event.target;
    const root = element();
    if (!root) return;

    if (containsElement(root, target)) return;

    const ignored = ignoredElements?.() ?? [];
    for (const ignoredEl of ignored) {
      if (containsElement(ignoredEl, target)) return;
    }

    onDismiss('pointer-outside');
  };

  const controller: DismissableLayerController = {
    activate() {
      if (active) return;
      active = true;
      layerStack.push(controller);
      const doc = getOwnerDocument(element());
      doc.addEventListener('keydown', handleKeyDown, true);
      doc.addEventListener('pointerdown', handlePointerDown, true);
    },
    deactivate() {
      if (!active) return;
      active = false;
      const idx = layerStack.indexOf(controller);
      if (idx !== -1) layerStack.splice(idx, 1);
      const doc = getOwnerDocument(element());
      doc.removeEventListener('keydown', handleKeyDown, true);
      doc.removeEventListener('pointerdown', handlePointerDown, true);
    }
  };

  return controller;
}
