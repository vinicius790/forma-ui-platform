import type { Rule } from 'eslint';

export interface FormaEslintPlugin {
  meta: { name: string; version: string };
  rules: Record<string, Rule.RuleModule>;
  configs: { recommended: { plugins: { forma: FormaEslintPlugin }; rules: Record<string, 'warn' | 'error'> } };
}

declare const plugin: FormaEslintPlugin;
export default plugin;
export declare const rules: FormaEslintPlugin['rules'];
export declare const configs: FormaEslintPlugin['configs'];
