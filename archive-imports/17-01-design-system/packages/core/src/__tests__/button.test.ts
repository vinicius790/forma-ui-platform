import { describe, it, expect, vi } from 'vitest';
import { getButtonProps } from '../components/button.js';

describe('Component 1: Button (@forma-ui/core/button)', () => {
  it('returns native button attributes by default', () => {
    const props = getButtonProps({ type: 'submit' });
    expect(props.type).toBe('submit');
    expect(props.role).toBeUndefined();
    expect(props['data-state']).toBe('idle');
  });

  it('activates non-native polymorphic element via Enter and Space keys', () => {
    const onPress = vi.fn();
    const props = getButtonProps({ elementType: 'span', onPress });
    expect(props.role).toBe('button');
    expect(props.tabIndex).toBe(0);

    props.onKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
    props.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('prevents interaction while loading or disabled while preserving aria-busy', () => {
    const onPress = vi.fn();
    const props = getButtonProps({ loading: true, onPress });
    expect(props['aria-busy']).toBe(true);
    expect(props['aria-disabled']).toBe(true);
    props.onClick(new MouseEvent('click'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
