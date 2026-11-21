import { composedContains } from './dom';

export interface DismissableLayerOptions {
  element: HTMLElement;
  onDismiss: (reason: 'escape' | 'outside-pointer' | 'outside-focus') => void;
  dismissOnEscape?: boolean;
  dismissOnOutsidePointer?: boolean;
  dismissOnOutsideFocus?: boolean;
  enabled?: boolean;
  excludeElements?: () => Array<HTMLElement | null | undefined>;
}

const stacks = new WeakMap<Document, DismissableLayer[]>();

function isEventInsideElement(element: HTMLElement | null | undefined, event: Event): boolean {
  if (!element) return false;
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (path.includes(element)) return true;
  const target = (path[0] ?? event.target) as Node | null;
  return composedContains(element, target);
}

export class DismissableLayer {
  private cleanup?: () => void;
  constructor(private options: DismissableLayerOptions) {}
  mount(): () => void {
    if (this.cleanup || this.options.enabled === false) return this.cleanup ?? (() => undefined);
    const doc = this.options.element.ownerDocument;
    const stack = stacks.get(doc) ?? [];
    stack.push(this);
    stacks.set(doc, stack);
    const top = () => stacks.get(doc)?.at(-1) === this;
    const isExcluded = (event: Event) =>
      this.options.excludeElements?.().some((element) => isEventInsideElement(element, event)) ??
      false;
    const pointer = (event: PointerEvent) => {
      if (
        top() &&
        this.options.dismissOnOutsidePointer !== false &&
        !isEventInsideElement(this.options.element, event) &&
        !isExcluded(event)
      ) {
        this.options.onDismiss('outside-pointer');
      }
    };
    const focus = (event: FocusEvent) => {
      if (
        top() &&
        this.options.dismissOnOutsideFocus &&
        !isEventInsideElement(this.options.element, event) &&
        !isExcluded(event)
      ) {
        this.options.onDismiss('outside-focus');
      }
    };
    const key = (event: KeyboardEvent) => {
      if (top() && event.key === 'Escape' && !event.isComposing && this.options.dismissOnEscape !== false) {
        event.preventDefault();
        this.options.onDismiss('escape');
      }
    };
    doc.addEventListener('pointerdown', pointer, true);
    doc.addEventListener('focusin', focus, true);
    doc.addEventListener('keydown', key, true);
    this.cleanup = () => {
      doc.removeEventListener('pointerdown', pointer, true);
      doc.removeEventListener('focusin', focus, true);
      doc.removeEventListener('keydown', key, true);
      const current = stacks.get(doc) ?? [];
      stacks.set(
        doc,
        current.filter((layer) => layer !== this),
      );
      this.cleanup = undefined;
    };
    return this.cleanup;
  }
}
