import '@testing-library/jest-dom/vitest';

if (typeof HTMLElement !== 'undefined' && !Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'inert')) {
  Object.defineProperty(HTMLElement.prototype, 'inert', {
    configurable: true,
    enumerable: true,
    get() {
      return this.hasAttribute('inert');
    },
    set(value: unknown) {
      if (value) this.setAttribute('inert', '');
      else this.removeAttribute('inert');
    },
  });
}

if (typeof globalThis.PointerEvent === 'undefined' && typeof globalThis.MouseEvent !== 'undefined') {
  globalThis.PointerEvent = globalThis.MouseEvent as unknown as typeof PointerEvent;
}
