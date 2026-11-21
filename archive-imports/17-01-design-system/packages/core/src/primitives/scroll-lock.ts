import { isBrowser } from './dom.js';

let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

/**
 * Bloqueia a rolagem do body com contagem de referência e compensação da largura
 * da barra de rolagem (--forma-scrollbar-width) para evitar layout shift em modais.
 */
export function acquireBodyScrollLock(doc: Document = document): () => void {
  if (!isBrowser()) return () => {};

  const body = doc.body;
  const html = doc.documentElement;

  if (lockCount === 0) {
    const win = doc.defaultView ?? window;
    const scrollbarWidth = Math.max(0, win.innerWidth - html.clientWidth);
    originalOverflow = body.style.overflow;
    originalPaddingRight = body.style.paddingRight;

    body.style.overflow = 'hidden';
    body.setAttribute('data-forma-scroll-locked', '');
    if (scrollbarWidth > 0) {
      html.style.setProperty('--forma-scrollbar-width', `${scrollbarWidth}px`);
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
      body.removeAttribute('data-forma-scroll-locked');
      html.style.removeProperty('--forma-scrollbar-width');
    }
  };
}

export function getActiveScrollLockCount(): number {
  return lockCount;
}
