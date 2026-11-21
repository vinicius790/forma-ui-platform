import { describe, it, expect } from 'vitest';
import { createToastStore } from '../components/toast.js';

describe('Component 7: Toast (@forma-ui/core/toast)', () => {
  it('transitions loading toast to success or error via toast.promise()', async () => {
    const store = createToastStore();
    const result = await store.promise(Promise.resolve(42), {
      loading: 'Processando...',
      success: (val) => `Concluído: ${val}`,
      error: 'Erro'
    });

    expect(result).toBe(42);
    const items = store.getToasts();
    expect(items[0]?.type).toBe('success');
    expect(items[0]?.title).toBe('Concluído: 42');
    store.dismissAll();
  });
});
