import { describe, it, expect } from 'vitest';
import { createSelectMachine } from '../components/select.js';

describe('Component 6: Select (@forma-ui/core/select)', () => {
  it('supports multi-select mode, keeps listbox open on selection, and syncs hidden input', () => {
    const multi = createSelectMachine({
      multiple: true,
      name: 'tags',
      options: [
        { value: 'a11y', label: 'Acessibilidade' },
        { value: 'rtl', label: 'Suporte RTL' },
        { value: 'tokens', label: 'Design Tokens' }
      ]
    });

    multi.open();
    multi.selectValue('a11y');
    multi.selectValue('tokens');

    expect(multi.getState().open).toBe(true);
    expect(multi.getState().selectedValues).toEqual(['a11y', 'tokens']);
    expect(multi.getHiddenInputProps().value).toBe('a11y,tokens');
    expect(multi.getListboxProps()['aria-multiselectable']).toBe(true);

    multi.selectValue('a11y');
    expect(multi.getState().selectedValues).toEqual(['tokens']);
  });
});
