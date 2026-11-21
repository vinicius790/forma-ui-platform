export interface ShortcutEntry {
  id: string;
  combo: string;
  label: string;
  scope?: string;
}

export interface ShortcutConflict {
  combo: string;
  scope: string;
  ids: string[];
}

export function formatShortcutLabel(combo: string, platform: 'mac' | 'other' = 'other'): string {
  return combo
    .split('+')
    .map((part) => {
      const k = part.trim().toLowerCase();
      if (k === 'mod') return platform === 'mac' ? '⌘' : 'Ctrl';
      if (k === 'shift') return platform === 'mac' ? '⇧' : 'Shift';
      if (k === 'alt') return platform === 'mac' ? '⌥' : 'Alt';
      return k.toUpperCase();
    })
    .join(platform === 'mac' ? '' : '+');
}

/** Accessible keyboard shortcut cheat-sheet registry with conflict detection across scopes. */
export class ShortcutRegistry {
  private entries = new Map<string, ShortcutEntry>();

  register(entry: ShortcutEntry): () => void {
    this.entries.set(entry.id, { scope: 'global', ...entry });
    return () => { this.entries.delete(entry.id); };
  }

  list(scope?: string): ShortcutEntry[] {
    const all = [...this.entries.values()];
    return scope ? all.filter((e) => e.scope === scope) : all;
  }

  findConflicts(): ShortcutConflict[] {
    const buckets = new Map<string, string[]>();
    for (const e of this.entries.values()) {
      const key = `${e.scope ?? 'global'}::${e.combo.toLowerCase().replace(/\s+/gu, '')}`;
      const list = buckets.get(key) ?? [];
      list.push(e.id);
      buckets.set(key, list);
    }
    const conflicts: ShortcutConflict[] = [];
    for (const [key, ids] of buckets) {
      if (ids.length > 1) {
        const [scope, combo] = key.split('::');
        conflicts.push({ scope: scope!, combo: combo!, ids });
      }
    }
    return conflicts;
  }

  destroy(): void { this.entries.clear(); }
}

export function createShortcutRegistry(): ShortcutRegistry {
  return new ShortcutRegistry();
}
