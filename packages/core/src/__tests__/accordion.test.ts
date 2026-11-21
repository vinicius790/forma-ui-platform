import { describe, expect, it, vi } from 'vitest';
import { createAccordionController } from '../components/accordion';

describe('accordion controller', () => {
  it('supports multiple open panels', () => { const state = createAccordionController({ multiple: true, defaultValue: ['a'] }); state.toggle('b'); expect(state.isOpen('a')).toBe(true); expect(state.isOpen('b')).toBe(true); });
  it('supports exclusive mode and reports state', () => { const state = createAccordionController({ defaultValue: 'a' }); state.toggle('b'); expect(state.value).toBe('b'); expect(state.getItemProps('b')['aria-expanded']).toBe(true); });
  it('does not toggle a disabled item', () => { const state = createAccordionController(); state.register('x', true); state.toggle('x'); expect(state.isOpen('x')).toBe(false); });
  it('notifies in controlled mode without mutating its input', () => { const onValueChange = vi.fn(); const state = createAccordionController({ value: 'a', onValueChange }); state.toggle('b'); expect(onValueChange).toHaveBeenCalledWith('b'); expect(state.value).toBe('a'); });
});
