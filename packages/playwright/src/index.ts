import type { Page } from '@playwright/test';
export interface AccessibilityAuditOptions { include?: string[]; exclude?: string[]; disableRules?: string[]; }
/** Lightweight semantic preflight; pair with axe-core in the consuming Playwright suite. */
export async function auditLandmarks(page: Page): Promise<string[]> {
  return page.locator('body').evaluateAll((elements) => {
    const body = elements[0]; if (!body) return ['Document body is missing'];
    const issues: string[] = [];
    if (!body.querySelector('main, [role="main"]')) issues.push('Page has no main landmark');
    if (!body.querySelector('h1')) issues.push('Page has no level-one heading');
    const unlabeled = [...body.querySelectorAll('button, input, select, textarea')].filter((node) => {
      const el = node as HTMLInputElement; return !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && el.type !== 'hidden';
    });
    if (unlabeled.length) issues.push(`${unlabeled.length} interactive form control(s) have no accessible label`);
    return issues;
  });
}

/** Emulates Windows High Contrast / CSS Forced Colors mode in Playwright. */
export async function emulateForcedColors(page: Page, active = true): Promise<void> {
  await page.emulateMedia({ forcedColors: active ? 'active' : 'none' });
}

/** Emulates `prefers-reduced-motion: reduce` in Playwright. */
export async function emulateReducedMotion(page: Page, reduced = true): Promise<void> {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
}

/** Tabs through up to `maxSteps` interactive elements and returns their tag/role/accessible-name trace. */
export async function auditFocusOrder(page: Page, maxSteps = 25): Promise<string[]> {
  const trace: string[] = [];
  for (let i = 0; i < maxSteps; i += 1) {
    await page.keyboard.press('Tab');
    const descriptor = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return 'body';
      const label = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || '';
      const role = el.getAttribute('role') || el.tagName.toLowerCase();
      return `${role}${label ? `:${label}` : ''}`;
    });
    if (trace.length > 0 && descriptor === trace[0]) break;
    trace.push(descriptor);
  }
  return trace;
}

export interface ReflowAuditResult {
  readonly passed: boolean;
  readonly scrollWidth: number;
  readonly clientWidth: number;
  readonly overflowPx: number;
  readonly viewport: Readonly<{ width: number; height: number }>;
}

/**
 * Sets viewport to 320×640 CSS px and verifies `scrollWidth <= clientWidth` as an automated signal
 * for WCAG 2.2 SC 1.4.10 (Reflow). Automated reflow checks supplement manual zoom/AT verification.
 */
export async function auditReflow320px(page: Page): Promise<ReflowAuditResult> {
  const viewport = { width: 320, height: 640 };
  await page.setViewportSize(viewport);
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
    };
  });
  const overflowPx = Math.max(0, metrics.scrollWidth - metrics.clientWidth);
  return {
    passed: metrics.scrollWidth <= metrics.clientWidth,
    scrollWidth: metrics.scrollWidth,
    clientWidth: metrics.clientWidth,
    overflowPx,
    viewport,
  };
}
