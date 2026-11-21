import { describe, expect, it } from 'vitest';
import {
  createHydrationScriptTag,
  createIdScope,
  createKeyedId,
  createRenderContext,
  hashRenderTree,
  renderDeclarativeShadowDom,
} from '../index';

describe('SSR id scopes', () => {
  it('isolates counters per request', () => {
    const first = createIdScope('request-a');
    const second = createIdScope('request-b');
    expect(first.next('dialog')).toBe('request-a-dialog-1');
    expect(second.next('dialog')).toBe('request-b-dialog-1');
    expect(first.next('dialog')).toBe('request-a-dialog-2');
  });
  it('provides stable keyed IDs independent of allocation order', () => {
    expect(createKeyedId('form', 'email', 'field')).toBe(createKeyedId('form', 'email', 'field'));
  });
  it('serializes a request scoped context', () => {
    const context = createRenderContext('render-1');
    context.ids.next('title');
    expect(context.serialize()).toEqual({ idPrefix: 'render-1', idCounter: 1 });
  });
  it('renders Declarative Shadow DOM, CSP-nonce hydration script tags, and FNV-1a tree hashes', () => {
    expect(renderDeclarativeShadowDom('<slot></slot>', ':host{display:block}', 'open')).toBe(
      '<template shadowrootmode="open"><style>:host{display:block}</style><slot></slot></template>',
    );
    const tag = createHydrationScriptTag('forma-state', { raw: '</script>' }, 'csp-123');
    expect(tag).toContain('nonce="csp-123"');
    expect(tag).not.toContain('</script></script>');
    expect(hashRenderTree('a')).toBe('e40c292c');
  });
});
