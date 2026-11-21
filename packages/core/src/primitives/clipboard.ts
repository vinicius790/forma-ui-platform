export type ClipboardStatus = 'idle' | 'copied' | 'error';

export interface ClipboardOptions {
  timeout?: number;
  onStatusChange?: (status: ClipboardStatus) => void;
}

export async function copyToClipboard(text: string, doc?: Document): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to execCommand below
    }
  }
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined);
  if (!targetDoc || !targetDoc.body) return false;
  const textarea = targetDoc.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  targetDoc.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = typeof targetDoc.execCommand === 'function' ? targetDoc.execCommand('copy') : false;
  } catch {
    ok = false;
  } finally {
    textarea.remove();
  }
  return ok;
}

export class ClipboardController {
  private options: ClipboardOptions;
  private statusValue: ClipboardStatus = 'idle';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(options: ClipboardOptions = {}) {
    this.options = { timeout: 2000, ...options };
  }

  get status(): ClipboardStatus {
    return this.statusValue;
  }

  get copied(): boolean {
    return this.statusValue === 'copied';
  }

  private setStatus(next: ClipboardStatus): void {
    if (this.destroyed || next === this.statusValue) return;
    this.statusValue = next;
    this.options.onStatusChange?.(next);
  }

  async copy(text: string, doc?: Document): Promise<boolean> {
    if (this.destroyed) return false;
    this.clearTimer();
    const ok = await copyToClipboard(text, doc);
    if (this.destroyed) return false;
    this.setStatus(ok ? 'copied' : 'error');
    const timeout = this.options.timeout ?? 2000;
    if (timeout > 0) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.setStatus('idle');
      }, timeout);
    }
    return ok;
  }

  reset(): void {
    this.clearTimer();
    this.setStatus('idle');
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.clearTimer();
  }
}

export function createClipboardController(options: ClipboardOptions = {}): ClipboardController {
  return new ClipboardController(options);
}
