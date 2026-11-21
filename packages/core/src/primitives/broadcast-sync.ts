/**
 * SSR-safe cross-tab state synchronization using BroadcastChannel.
 * Ideal for theme, toast, locale, or session state synchronization across browser tabs.
 */

export interface BroadcastSyncHandle<T> {
  post(payload: T): boolean;
  destroy(): void;
}

export function createBroadcastSync<T>(
  channelName: string,
  onMessage: (payload: T) => void,
): BroadcastSyncHandle<T> {
  if (typeof BroadcastChannel === 'undefined') {
    return { post: () => false, destroy: () => {} };
  }
  const channel = new BroadcastChannel(channelName);
  let active = true;
  const handler = (event: MessageEvent<T>) => {
    if (active) onMessage(event.data);
  };
  channel.addEventListener('message', handler);
  return {
    post(payload: T): boolean {
      if (!active) return false;
      try {
        channel.postMessage(payload);
        return true;
      } catch {
        return false;
      }
    },
    destroy() {
      if (!active) return;
      active = false;
      channel.removeEventListener('message', handler);
      channel.close();
    },
  };
}
