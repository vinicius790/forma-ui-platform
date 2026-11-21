import { describe, expect, it } from 'vitest';
import { getButtonProps } from '../components/button';

describe('button primitive', () => {
  it('defaults to a non-submitting native button', () => { expect(getButtonProps().type).toBe('button'); });
  it('communicates loading and disabled states without adding styles', () => { const props = getButtonProps({ loading: true, disabled: true }); expect(props.disabled).toBe(true); expect(props['aria-busy']).toBe(true); expect(props['data-loading']).toBe(''); });
});
