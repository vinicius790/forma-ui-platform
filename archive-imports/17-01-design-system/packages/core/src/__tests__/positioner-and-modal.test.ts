import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeFloatingPosition,
  ariaHideOutside,
  acquireBodyScrollLock,
  getActiveScrollLockCount
} from '../index.js';

describe('@forma-ui/core — Floating Positioner, ScrollLock & ariaHideOutside', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('computes bottom-start placement and flips to top when overflowing viewport bottom', () => {
    const posNormal = computeFloatingPosition(
      { x: 100, y: 100, width: 120, height: 40 },
      { width: 180, height: 120 },
      { placement: 'bottom-start', offset: 6, viewport: { width: 800, height: 600 } }
    );
    expect(posNormal.side).toBe('bottom');
    expect(posNormal.x).toBe(100);
    expect(posNormal.y).toBe(146);

    const posFlipped = computeFloatingPosition(
      { x: 100, y: 520, width: 120, height: 40 },
      { width: 180, height: 120 },
      { placement: 'bottom-start', offset: 6, viewport: { width: 800, height: 600 } }
    );
    expect(posFlipped.side).toBe('top');
    expect(posFlipped.y).toBe(394);
  });

  it('mirrors horizontal start/end alignment in RTL mode', () => {
    const rtlPos = computeFloatingPosition(
      { x: 200, y: 100, width: 100, height: 40 },
      { width: 160, height: 80 },
      { placement: 'bottom-start', dir: 'rtl', offset: 4, viewport: { width: 800, height: 600 } }
    );
    expect(rtlPos.x).toBe(140); // 200 + 100 - 160
  });

  it('hides sibling DOM trees via aria-hidden="true" when modal is active and restores accurately', () => {
    const appHeader = document.createElement('header');
    const appMain = document.createElement('main');
    appMain.setAttribute('aria-hidden', 'false');
    const modalPortal = document.createElement('div');
    const modalContent = document.createElement('div');
    modalPortal.appendChild(modalContent);
    document.body.append(appHeader, appMain, modalPortal);

    const restore = ariaHideOutside([modalContent]);
    expect(appHeader.getAttribute('aria-hidden')).toBe('true');
    expect(appMain.getAttribute('aria-hidden')).toBe('true');
    expect(modalContent.getAttribute('aria-hidden')).toBeNull();

    restore();
    expect(appHeader.getAttribute('aria-hidden')).toBeNull();
    expect(appMain.getAttribute('aria-hidden')).toBe('false');
  });

  it('manages reference-counted body scroll locks without premature unlock', () => {
    const release1 = acquireBodyScrollLock(document);
    const release2 = acquireBodyScrollLock(document);
    expect(getActiveScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe('hidden');

    release1();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe('hidden');

    release2();
    expect(getActiveScrollLockCount()).toBe(0);
  });
});
