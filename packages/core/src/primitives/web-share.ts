/** SSR-safe progressive wrappers for Web Share API and Screen Wake Lock API. */

export function supportsWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
  if (!supportsWebShare()) return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

export async function acquireWakeLock(): Promise<() => Promise<void>> {
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }) : undefined;
  if (!nav?.wakeLock) return async () => {};
  try {
    const sentinel = await nav.wakeLock.request('screen');
    let released = false;
    return async () => {
      if (released) return;
      released = true;
      await sentinel.release();
    };
  } catch {
    return async () => {};
  }
}
