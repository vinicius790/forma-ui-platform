export interface TypeaheadItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TypeaheadController {
  handleKey: (key: string, items: readonly TypeaheadItem[], currentIndex: number) => number | null;
  reset: () => void;
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function createTypeahead(timeoutMs = 700): TypeaheadController {
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    buffer = '';
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    reset,
    handleKey(key, items, currentIndex) {
      if (key.length !== 1 || key === ' ') return null;

      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        buffer = '';
        timer = null;
      }, timeoutMs);

      buffer += normalizeText(key);
      const count = items.length;
      if (count === 0) return null;

      const isRepeatedSingleChar =
        buffer.length > 1 && buffer.split('').every((ch) => ch === buffer[0]);
      const searchQuery = isRepeatedSingleChar ? buffer[0]! : buffer;
      const startOffset = isRepeatedSingleChar || buffer.length === 1 ? 1 : 0;

      for (let i = 0; i < count; i++) {
        const candidateIndex = (Math.max(0, currentIndex) + startOffset + i) % count;
        const item = items[candidateIndex];
        if (!item || item.disabled) continue;
        if (normalizeText(item.label).startsWith(searchQuery)) {
          return candidateIndex;
        }
      }

      return null;
    }
  };
}
