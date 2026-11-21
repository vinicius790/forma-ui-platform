export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';
export interface FilterCondition { id: string; field: string; operator: FilterOperator; value: unknown }
export interface FilterGroup { id: string; combinator: 'AND' | 'OR'; rules: Array<FilterCondition | FilterGroup> }

function isGroup(rule: FilterCondition | FilterGroup): rule is FilterGroup {
  return 'combinator' in rule && Array.isArray(rule.rules);
}

export function evaluateFilterGroup(group: FilterGroup, record: Readonly<Record<string, unknown>>): boolean {
  const results = group.rules.map((rule) => {
    if (isGroup(rule)) return evaluateFilterGroup(rule, record);
    const actual = record[rule.field];
    if (rule.operator === 'eq') return Object.is(actual, rule.value);
    if (rule.operator === 'neq') return !Object.is(actual, rule.value);
    if (rule.operator === 'gt') return typeof actual === 'number' && typeof rule.value === 'number' && actual > rule.value;
    if (rule.operator === 'lt') return typeof actual === 'number' && typeof rule.value === 'number' && actual < rule.value;
    if (rule.operator === 'contains') return String(actual ?? '').toLowerCase().includes(String(rule.value ?? '').toLowerCase());
    if (rule.operator === 'in') return Array.isArray(rule.value) && rule.value.includes(actual);
    return false;
  });
  if (results.length === 0) return true;
  return group.combinator === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

export class FilterBuilderController {
  private root: FilterGroup;
  constructor(initial?: FilterGroup) {
    this.root = initial ?? { id: 'root', combinator: 'AND', rules: [] };
  }
  get group(): FilterGroup { return this.root; }
  setCombinator(combinator: 'AND' | 'OR'): void { this.root = { ...this.root, combinator }; }
  addCondition(cond: FilterCondition): void { this.root = { ...this.root, rules: [...this.root.rules, cond] }; }
  removeRule(id: string): void { this.root = { ...this.root, rules: this.root.rules.filter((r) => r.id !== id) }; }
  matches(record: Readonly<Record<string, unknown>>): boolean { return evaluateFilterGroup(this.root, record); }
  destroy(): void {}
}
export function createFilterBuilderController(initial?: FilterGroup): FilterBuilderController {
  return new FilterBuilderController(initial);
}
