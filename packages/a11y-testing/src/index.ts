import axe from 'axe-core';
import type { RunOptions, AxeResults, Result } from 'axe-core';

export interface A11yAuditOptions { rules?: string[]; exclude?: string[]; runOptions?: RunOptions }
export interface A11yAudit { results: AxeResults; violations: Result[]; passes: number; incomplete: number }

export async function auditAccessibility(target: Element | Document = document, options: A11yAuditOptions = {}): Promise<A11yAudit> {
  const context = options.exclude?.length ? { include: [target], exclude: options.exclude } : target;
  const result = await axe.run(context as Parameters<typeof axe.run>[0], {
    runOnly: options.rules?.length ? { type: 'rule', values: options.rules } : undefined,
    ...options.runOptions,
  });
  return { results: result, violations: result.violations, passes: result.passes.length, incomplete: result.incomplete.length };
}

export async function assertNoA11yViolations(target: Element | Document = document, options: A11yAuditOptions = {}): Promise<A11yAudit> {
  const audit = await auditAccessibility(target, options);
  if (audit.violations.length) {
    const details = audit.violations.map((item) => `${item.id} (${item.impact ?? 'unknown'}): ${item.help}\n${item.nodes.map((node) => `  - ${node.target.join(', ')}`).join('\n')}`).join('\n');
    throw new Error(`Acessibilidade: ${audit.violations.length} violação(ões) axe-core\n${details}`);
  }
  return audit;
}

export interface AriaContract { role?: string; requiredAttributes?: string[]; nameRequired?: boolean; stateAttributes?: string[] }
export function assertAriaContract(element: Element, contract: AriaContract): void {
  const role = element.getAttribute('role');
  if (contract.role && role !== contract.role) throw new Error(`Esperado role="${contract.role}", recebido ${String(role)}.`);
  for (const attribute of contract.requiredAttributes ?? []) if (!element.hasAttribute(attribute)) throw new Error(`Atributo obrigatório ausente: ${attribute}`);
  for (const attribute of contract.stateAttributes ?? []) if (!element.hasAttribute(attribute)) throw new Error(`Atributo de estado ausente: ${attribute}`);
  if (contract.nameRequired) {
    const hasName = Boolean(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.textContent?.trim());
    if (!hasName) throw new Error('O elemento precisa de um nome acessível por texto, aria-label ou aria-labelledby.');
  }
}

export function formatA11yViolations(violations: readonly Result[]): string {
  return violations.map((item) => `[${item.impact ?? 'unknown'}] ${item.id}: ${item.help} — ${item.helpUrl}`).join('\n');
}

/** Verifies that sibling landmarks outside a mounted modal dialog are isolated via `inert` or `aria-hidden="true"`. */
export function assertModalIsolation(modalElement: Element, root: ParentNode = document.body): void {
  const children = [...root.children];
  for (const child of children) {
    if (child === modalElement || child.contains(modalElement)) continue;
    const tag = child.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'template') continue;
    const isolated = child.hasAttribute('inert') || child.getAttribute('aria-hidden') === 'true';
    if (!isolated) {
      throw new Error(`Modal isolation violation: outside sibling <${tag}> is neither inert nor aria-hidden="true".`);
    }
  }
}

export interface TargetSizeRect {
  readonly width: number;
  readonly height: number;
}

/**
 * Asserts WCAG 2.2 SC 2.5.8 (Target Size Minimum) bounding box dimensions (default 24x24 CSS px).
 * Note: Automated bounding-box checks do not evaluate spacing exceptions or inline text exemptions.
 */
export function assertMinimumTargetSize(rect: TargetSizeRect, minPx = 24): void {
  if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) {
    throw new Error(`Invalid target size rect: width=${String(rect.width)}, height=${String(rect.height)}.`);
  }
  if (rect.width < minPx || rect.height < minPx) {
    throw new Error(
      `Target size (${rect.width}px × ${rect.height}px) is below WCAG 2.2 SC 2.5.8 minimum of ${minPx}px × ${minPx}px.`,
    );
  }
}
