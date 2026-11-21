import { describe, it, expect, vi } from 'vitest';
import { createMenuMachine } from '../components/menu.js';

describe('Component 3: Menu (@forma-ui/core/menu)', () => {
  it('supports menuitemcheckbox and menuitemradio ARIA semantics and diacritic typeahead', () => {
    const onSelect = vi.fn();
    const menu = createMenuMachine({
      items: [
        { id: 'bold', label: 'Negrito', type: 'checkbox', checked: true },
        { id: 'action', label: 'Ação Rápida' },
        { id: 'align-left', label: 'Alinhar à esquerda', type: 'radio', checked: false }
      ],
      onSelectItem: onSelect
    });

    menu.open('first');
    const firstProps = menu.getItemProps(
      { id: 'bold', label: 'Negrito', type: 'checkbox', checked: true },
      0
    );
    expect(firstProps.role).toBe('menuitemcheckbox');
    expect(firstProps['aria-checked']).toBe(true);

    // Typeahead "acao" without accents matches "Ação Rápida"
    const mp = menu.getMenuProps();
    mp.onKeyDown(new KeyboardEvent('keydown', { key: 'a' }));
    mp.onKeyDown(new KeyboardEvent('keydown', { key: 'c' }));
    expect(menu.getState().highlightedIndex).toBe(1);
  });
});
