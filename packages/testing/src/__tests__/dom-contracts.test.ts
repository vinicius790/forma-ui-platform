import { afterEach, describe, expect, it } from 'vitest';
import { assertNoBrokenAriaReferences, assertNoDuplicateIds, assertRtlArrowMirroring, findFocusableElements } from '../index';

afterEach(() => document.body.replaceChildren());

describe('DOM contract helpers', () => {
  it('finds dangling ARIA references and duplicate IDs', () => {
    document.body.innerHTML = '<button id="a" aria-describedby="missing">A</button><span id="dup"></span><span id="dup"></span>';
    expect(() => assertNoBrokenAriaReferences(document.body)).toThrow(/missing/);
    expect(() => assertNoDuplicateIds(document.body)).toThrow(/dup/);
  });
  it('returns visible focusable descendants and excludes hidden or inert nodes', () => {
    document.body.innerHTML = '<button id="a">A</button><button hidden>B</button><div inert><button>C</button></div><a href="#x">D</a><button disabled>E</button><div tabindex="-1">F</div><div contenteditable="true">G</div><fieldset disabled><input id="disabled-by-fieldset"></fieldset>';
    expect(findFocusableElements(document.body).map((node) => node.id)).toEqual(['a', '', '']);
  });
  it('verifies RTL horizontal arrow key mirroring', () => {
    expect(() => assertRtlArrowMirroring((key, dir) => (key === 'ArrowRight' ? 1 : -1) * (dir === 'rtl' ? -1 : 1))).not.toThrow();
    expect(() => assertRtlArrowMirroring((key) => (key === 'ArrowRight' ? 1 : -1))).toThrow(/mirroring/);
  });
});
