export interface AriaReferenceIssue { element: Element; attribute: string; missingId: string }

/** Find dangling IDREF tokens in aria-labelledby/describedby/controls/owns/flowto. */
export function findBrokenAriaReferences(root: ParentNode): AriaReferenceIssue[] {
  const attributes = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-flowto', 'aria-details'];
  const issues: AriaReferenceIssue[] = [];
  for (const element of root.querySelectorAll('*')) {
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      for (const id of value.trim().split(/\s+/u)) {
        if (id && !root.querySelector(`#${cssEscape(id)}`)) issues.push({ element, attribute, missingId: id });
      }
    }
  }
  return issues;
}

/** Detect duplicate IDs without relying on CSS selector escaping. */
export function findDuplicateIds(root: ParentNode): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const element of root.querySelectorAll('[id]')) {
    const id = element.id;
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

export function findFocusableElements(root: ParentNode): HTMLElement[] {
  const selector = [
    'a[href]', 'area[href]', 'button:not(:disabled)', 'input:not(:disabled):not([type="hidden"])',
    'select:not(:disabled)', 'textarea:not(:disabled)', 'iframe', 'object', 'embed',
    'audio[controls]', 'video[controls]', 'summary', '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]',
  ].join(',');
  return [...root.querySelectorAll<HTMLElement>(selector)].filter((element) => {
    if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    const rawTabIndex = element.getAttribute('tabindex');
    if (rawTabIndex !== null && Number.isFinite(Number(rawTabIndex)) && Number(rawTabIndex) < 0) return false;
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
    // A hidden ancestor can suppress the element even when the element itself
    // has no hidden attribute. This remains a DOM heuristic, not a browser AOM.
    return !element.closest('[aria-hidden="true"]');
  });
}

export function assertNoBrokenAriaReferences(root: ParentNode): void {
  const issues = findBrokenAriaReferences(root);
  if (issues.length) throw new Error(issues.map((issue) => `${issue.attribute} references missing #${issue.missingId}`).join('\n'));
}
export function assertNoDuplicateIds(root: ParentNode): void {
  const ids = findDuplicateIds(root);
  if (ids.length) throw new Error(`Duplicate IDs: ${ids.join(', ')}`);
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/gu, (character) => `\\${character.codePointAt(0)!.toString(16)} `);
}

export interface ControllerContractCheckResult {
  passed: boolean;
  issues: string[];
}

/** Shared conformance check verifying idempotent teardown and clean re-instantiation across framework adapters. */
export function runControllerContractCheck<C extends { destroy: () => void }>(
  create: () => C,
  exercise?: (controller: C) => void,
): ControllerContractCheckResult {
  const issues: string[] = [];
  let ctrl: C;
  try {
    ctrl = create();
  } catch (err) {
    return { passed: false, issues: [`Failed to construct controller: ${String(err)}`] };
  }
  try {
    exercise?.(ctrl);
  } catch (err) {
    issues.push(`Exercise callback threw: ${String(err)}`);
  }
  try {
    ctrl.destroy();
    ctrl.destroy();
  } catch (err) {
    issues.push(`destroy() is not idempotent: ${String(err)}`);
  }
  return { passed: issues.length === 0, issues };
}

/** Asserts that at least `minCount` focusable controls exist and none use positive tabIndex. */
export function assertKeyboardReachable(root: ParentNode, minCount = 1): HTMLElement[] {
  const focusables = findFocusableElements(root);
  if (focusables.length < minCount) {
    throw new Error(`Expected at least ${minCount} keyboard-focusable element(s), found ${focusables.length}.`);
  }
  for (const el of focusables) {
    const raw = el.getAttribute('tabindex');
    if (raw !== null && Number(raw) > 0) {
      throw new Error(`Positive tabIndex="${raw}" detected on <${el.tagName.toLowerCase()}>.`);
    }
  }
  return focusables;
}

export type HorizontalArrowKey = 'ArrowLeft' | 'ArrowRight';
export type TextDirection = 'ltr' | 'rtl';

/**
 * Asserts that horizontal arrow key behavior mirrors symmetrically between LTR and RTL directions
 * (ArrowRight in LTR matches ArrowLeft in RTL, and ArrowLeft in LTR matches ArrowRight in RTL).
 */
export function assertRtlArrowMirroring<T>(
  resolve: (key: HorizontalArrowKey, dir: TextDirection) => T,
  equals: (a: T, b: T) => boolean = Object.is,
): void {
  const ltrRight = resolve('ArrowRight', 'ltr');
  const ltrLeft = resolve('ArrowLeft', 'ltr');
  const rtlRight = resolve('ArrowRight', 'rtl');
  const rtlLeft = resolve('ArrowLeft', 'rtl');

  if (equals(ltrRight, ltrLeft)) {
    throw new Error('RTL arrow mirroring check failed: ArrowLeft and ArrowRight produced identical LTR results.');
  }
  if (!equals(ltrRight, rtlLeft)) {
    throw new Error(
      `RTL arrow mirroring violation: LTR ArrowRight (${String(ltrRight)}) did not match RTL ArrowLeft (${String(rtlLeft)}).`,
    );
  }
  if (!equals(ltrLeft, rtlRight)) {
    throw new Error(
      `RTL arrow mirroring violation: LTR ArrowLeft (${String(ltrLeft)}) did not match RTL ArrowRight (${String(rtlRight)}).`,
    );
  }
}
