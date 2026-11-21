import { describe, expect, it, vi } from 'vitest';
import { createAlertDialogController, createDialogController } from '../components/dialog';

describe('dialog controller', () => {
  it('supports controlled and uncontrolled state', () => { const dialog = createDialogController(); dialog.show(); expect(dialog.open).toBe(true); dialog.close(); expect(dialog.open).toBe(false); });
  it('notifies controlled state transitions', () => { const change = vi.fn(); const dialog = createDialogController({ open: false, onOpenChange: change }); dialog.show(); expect(change).toHaveBeenCalledWith(true); expect(dialog.open).toBe(false); });
  it('exposes an alertdialog variant using the same modal controller', () => { expect(createAlertDialogController().getContentProps().role).toBe('alertdialog'); });
  it('exposes dialog semantics and does not claim modal when disabled', () => { expect(createDialogController({ modal: false }).getContentProps().role).toBe('dialog'); expect(createDialogController({ modal: false }).getContentProps()['aria-modal']).toBeUndefined(); });
  it('does not steal focus when content is attached while the dialog is closed', () => { const trigger = document.createElement('button'); const outside = document.createElement('button'); const content = document.createElement('section'); document.body.append(trigger, outside, content); outside.focus(); const dialog = createDialogController(); dialog.setTrigger(trigger); dialog.setContent(content); expect(document.activeElement).toBe(outside); dialog.destroy(); trigger.remove(); outside.remove(); content.remove(); });
  it('creates a portal only when mounted in a DOM environment', () => { const dialog = createDialogController(); expect(dialog.mountPortal()).toBeInstanceOf(HTMLElement); dialog.destroy(); });
});
