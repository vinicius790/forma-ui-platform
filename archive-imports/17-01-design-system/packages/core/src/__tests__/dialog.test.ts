import { describe, it, expect, beforeEach } from 'vitest';
import { createDialogMachine } from '../components/dialog.js';

describe('Component 2: Dialog (@forma-ui/core/dialog)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('supports alertdialog role and prevents outside click dismissal by default on alertdialog', () => {
    const alertDlg = createDialogMachine({ role: 'alertdialog', defaultOpen: true });
    expect(alertDlg.getContentProps().role).toBe('alertdialog');

    const overlayProps = alertDlg.getOverlayProps();
    const fakeEvent = { target: 'same', currentTarget: 'same' } as unknown as PointerEvent;
    overlayProps.onPointerDown(fakeEvent);
    // alertdialog remains open on backdrop pointerdown
    expect(alertDlg.getState().open).toBe(true);
    alertDlg.destroy();
  });

  it('isolates background DOM with aria-hidden when modal dialog mounts', () => {
    const background = document.createElement('div');
    const dialogEl = document.createElement('div');
    const closeBtn = document.createElement('button');
    dialogEl.appendChild(closeBtn);
    document.body.append(background, dialogEl);

    const dlg = createDialogMachine({ defaultOpen: true, modal: true });
    const unmount = dlg.mountContent(dialogEl);

    expect(background.getAttribute('aria-hidden')).toBe('true');
    unmount();
    expect(background.getAttribute('aria-hidden')).toBeNull();
    dlg.destroy();
  });
});
