import axe, { type AxeResults, type RunOptions } from 'axe-core';

export interface A11yAuditOptions {
  rules?: RunOptions['rules'];
  disableColorContrast?: boolean;
}

export async function runAxeAudit(
  container: Element | Document = document.body,
  options: A11yAuditOptions = {}
): Promise<AxeResults> {
  const runOptions: RunOptions = {
    rules: {
      ...(options.disableColorContrast !== false
        ? { 'color-contrast': { enabled: false } }
        : {}),
      ...options.rules
    }
  };
  return axe.run(container as Element, runOptions);
}

export async function expectNoA11yViolations(
  container: Element | Document = document.body,
  options: A11yAuditOptions = {}
): Promise<void> {
  const results = await runAxeAudit(container, options);
  if (results.violations.length > 0) {
    const formatted = results.violations
      .map(
        (v) =>
          `[${v.id}] (${v.impact ?? 'unknown'}): ${v.help}\n` +
          v.nodes
            .map((n) => `  - Target: ${n.target.join(', ')} | ${n.failureSummary ?? ''}`)
            .join('\n')
      )
      .join('\n\n');
    throw new Error(
      `Acessibilidade WAI-ARIA/WCAG violada (${results.violations.length} falha(s)):\n${formatted}`
    );
  }
}

export function assertAriaAttributes(
  element: Element,
  expected: Record<string, string | null>
): void {
  for (const [attr, expectedVal] of Object.entries(expected)) {
    const actual = element.getAttribute(attr);
    if (actual !== expectedVal) {
      throw new Error(
        `Atributo ARIA divergente em <${element.tagName.toLowerCase()}> para "${attr}": esperado "${String(
          expectedVal
        )}", recebido "${String(actual)}"`
      );
    }
  }
}

export interface KeyStep {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

/**
 * Dispara uma sequência determinística de eventos keydown no elemento atualmente
 * focado (ou no alvo informado), retornando o histórico de elementos focados.
 */
export function simulateKeyboardSequence(
  steps: ReadonlyArray<string | KeyStep>,
  initialTarget?: HTMLElement
): HTMLElement[] {
  if (initialTarget) {
    initialTarget.focus();
  }
  const focusedHistory: HTMLElement[] = [];

  for (const step of steps) {
    const normalized: KeyStep = typeof step === 'string' ? { key: step } : step;
    const active = (document.activeElement as HTMLElement | null) ?? initialTarget ?? document.body;
    active.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: normalized.key,
        shiftKey: Boolean(normalized.shiftKey),
        ctrlKey: Boolean(normalized.ctrlKey),
        altKey: Boolean(normalized.altKey),
        bubbles: true,
        cancelable: true
      })
    );
    if (document.activeElement instanceof HTMLElement) {
      focusedHistory.push(document.activeElement);
    }
  }

  return focusedHistory;
}
