import { isBrowser } from './dom.js';
import type { Direction } from './roving-tabindex.js';

export interface PortalOptions {
  target?: HTMLElement | null;
  id?: string;
  dir?: Direction;
  lang?: string;
}

export interface PortalController {
  mount: () => HTMLElement | null;
  unmount: () => void;
  getElement: () => HTMLElement | null;
}

export function createPortalHost(options: PortalOptions = {}): PortalController {
  let hostElement: HTMLElement | null = null;

  return {
    mount() {
      if (!isBrowser()) return null;
      if (hostElement && hostElement.isConnected) return hostElement;

      const parent = options.target ?? document.body;
      const el = document.createElement('div');
      el.setAttribute('data-forma-portal', '');
      if (options.id) el.id = options.id;
      if (options.dir) el.dir = options.dir;
      if (options.lang) el.lang = options.lang;
      parent.appendChild(el);
      hostElement = el;
      return el;
    },
    unmount() {
      if (hostElement && hostElement.parentNode) {
        hostElement.parentNode.removeChild(hostElement);
      }
      hostElement = null;
    },
    getElement() {
      return hostElement;
    }
  };
}
