export interface HotkeyBinding {
  combo: string;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  allowInInputs?: boolean;
}

export interface ParsedHotkey {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  mod: boolean;
}

export function parseHotkey(combo: string): ParsedHotkey {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
  const key = parts[parts.length - 1] ?? '';
  const mods = new Set(parts.slice(0, -1));
  return {
    key,
    ctrl: mods.has('ctrl') || mods.has('control'),
    meta: mods.has('meta') || mods.has('cmd') || mods.has('command'),
    alt: mods.has('alt') || mods.has('option'),
    shift: mods.has('shift'),
    mod: mods.has('mod'),
  };
}

export function matchesHotkey(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
  parsed: ParsedHotkey,
): boolean {
  if (event.key.toLowerCase() !== parsed.key) return false;
  if (parsed.mod) {
    if (!event.ctrlKey && !event.metaKey) return false;
  } else {
    if (event.ctrlKey !== parsed.ctrl || event.metaKey !== parsed.meta) return false;
  }
  return event.altKey === parsed.alt && event.shiftKey === parsed.shift;
}

export function registerHotkeys(
  bindings: readonly HotkeyBinding[],
  target?: EventTarget | null,
): () => void {
  const resolved = target ?? (typeof window !== 'undefined' ? window : null);
  if (!resolved || typeof resolved.addEventListener !== 'function') return () => {};
  const compiled = bindings.map((b) => ({ ...b, parsed: parseHotkey(b.combo) }));
  let active = true;

  const listener = (raw: Event) => {
    if (!active) return;
    const event = raw as KeyboardEvent;
    const el = event.target as HTMLElement | null;
    const inInput = Boolean(
      el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable),
    );
    for (const item of compiled) {
      if (inInput && !item.allowInInputs) continue;
      if (matchesHotkey(event, item.parsed)) {
        if (item.preventDefault !== false) event.preventDefault();
        item.handler(event);
        return;
      }
    }
  };

  resolved.addEventListener('keydown', listener);
  return () => {
    if (!active) return;
    active = false;
    resolved.removeEventListener('keydown', listener);
  };
}
