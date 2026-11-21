import type { FieldName, FormController, FormErrors } from './index';

export interface ComputedFieldRule<
  Values extends object,
  Target extends FieldName<Values> = FieldName<Values>,
> {
  readonly target: Target;
  readonly sources?: readonly FieldName<Values>[];
  readonly compute: (values: Readonly<Values>) => Values[Target];
  readonly validateOnUpdate?: boolean;
}

export interface ComputedFieldsOptions {
  /** Maximum propagation passes per change cycle to prevent infinite loops. Default: 10. */
  maxIterations?: number;
  /** Whether to evaluate all rules immediately upon creation. Default: false. */
  immediate?: boolean;
}

export interface ComputedFieldsEngine {
  /** Evaluates all computed rules once and propagates downstream dependencies. */
  recompute(): void;
  /** Unsubscribes from the form controller. Safe to call multiple times. */
  destroy(): void;
}

/**
 * Declarative derived/computed field engine bound to a FormController.
 * Updates target fields when source values change, with cycle protection and idempotent cleanup.
 */
export function createComputedFieldsEngine<Values extends object>(
  form: FormController<Values>,
  rules: readonly ComputedFieldRule<Values>[],
  options: ComputedFieldsOptions = {},
): ComputedFieldsEngine {
  const maxIterations = Math.max(
    1,
    Number.isFinite(options.maxIterations ?? 10) ? Math.floor(options.maxIterations ?? 10) : 10,
  );
  let active = true;
  let computing = false;
  let prevValues: Record<string, unknown> = { ...(form.getSnapshot().values as unknown as Record<string, unknown>) };

  const propagate = (initialChanged: Set<string>, forceAllFirstPass: boolean): void => {
    if (!active || computing) return;
    computing = true;
    try {
      let changed = initialChanged;
      for (let pass = 0; pass < maxIterations; pass += 1) {
        if (!forceAllFirstPass && changed.size === 0) break;
        const nextChanged = new Set<string>();
        for (const rule of rules) {
          const shouldRun =
            (pass === 0 && forceAllFirstPass) ||
            (rule.sources !== undefined
              ? rule.sources.some((source) => changed.has(source))
              : Array.from(changed).some((key) => key !== rule.target));
          if (!shouldRun) continue;

          const currentValues = form.getSnapshot().values;
          const nextValue = rule.compute(currentValues);
          const currentTargetValue = currentValues[rule.target];
          if (!Object.is(currentTargetValue, nextValue)) {
            form.setFieldValue(rule.target, nextValue, rule.validateOnUpdate ?? false);
            nextChanged.add(rule.target);
          }
        }
        forceAllFirstPass = false;
        if (nextChanged.size === 0) break;
        changed = nextChanged;
      }
      prevValues = { ...(form.getSnapshot().values as unknown as Record<string, unknown>) };
    } finally {
      computing = false;
    }
  };

  const unsubscribe = form.subscribe(() => {
    if (!active || computing) return;
    const current = form.getSnapshot().values as unknown as Record<string, unknown>;
    const keys = new Set([...Object.keys(prevValues), ...Object.keys(current)]);
    const changed = new Set<string>();
    for (const key of keys) {
      if (!Object.is(prevValues[key], current[key])) changed.add(key);
    }
    if (changed.size === 0) return;
    propagate(changed, false);
  });

  if (options.immediate) {
    propagate(new Set<string>(), true);
  }

  return {
    recompute() {
      if (!active) return;
      propagate(new Set<string>(), true);
    },
    destroy() {
      if (!active) return;
      active = false;
      unsubscribe();
    },
  };
}

export type JsonSchemaPrimitiveType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

export interface JsonSchemaProperty {
  readonly type?: JsonSchemaPrimitiveType | readonly JsonSchemaPrimitiveType[];
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly pattern?: string | RegExp;
  readonly enum?: readonly unknown[];
  readonly message?: string;
}

export interface JsonSchemaObject<Values extends object = Record<string, unknown>> {
  readonly type?: 'object';
  readonly required?: readonly FieldName<Values>[];
  readonly properties?: Partial<Record<FieldName<Values>, JsonSchemaProperty>>;
}

function matchesSchemaType(value: unknown, expected: JsonSchemaPrimitiveType): boolean {
  switch (expected) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'null':
      return value === null;
  }
}

function compilePattern(pattern: string | RegExp): RegExp {
  if (typeof pattern === 'string') return new RegExp(pattern);
  const flags = pattern.flags.replace(/[gy]/gu, '');
  return new RegExp(pattern.source, flags);
}

/**
 * Lightweight framework-neutral JSON Schema subset validator returning FormErrors<Values>
 * directly compatible with FormOptions.validate.
 */
export function createJsonSchemaFormValidator<Values extends object>(
  schema: JsonSchemaObject<Values>,
): (values: Readonly<Values>) => FormErrors<Values> {
  const requiredSet = new Set<string>(schema.required ?? []);
  const properties = (schema.properties ?? {}) as unknown as Record<string, JsonSchemaProperty | undefined>;
  const compiledPatterns = new Map<string, RegExp>();
  const allFields = new Set<string>([...requiredSet, ...Object.keys(properties)]);

  for (const [field, prop] of Object.entries(properties)) {
    if (prop?.pattern !== undefined) {
      compiledPatterns.set(field, compilePattern(prop.pattern));
    }
  }

  return (values: Readonly<Values>): FormErrors<Values> => {
    const errors: Record<string, string> = {};
    const record = values as unknown as Record<string, unknown>;

    for (const field of allFields) {
      const value = record[field];
      const prop = properties[field];

      if (requiredSet.has(field) && (value === undefined || value === null || value === '')) {
        errors[field] = prop?.message ?? `${field} is required.`;
        continue;
      }

      if (value === undefined || !prop) continue;

      if (prop.type !== undefined) {
        const allowedTypes = Array.isArray(prop.type) ? prop.type : [prop.type];
        const validType = allowedTypes.some((t) => matchesSchemaType(value, t));
        if (!validType) {
          errors[field] = prop.message ?? `${field} must be of type ${allowedTypes.join(' or ')}.`;
          continue;
        }
      }

      if (prop.enum !== undefined && !prop.enum.some((entry) => Object.is(entry, value))) {
        errors[field] = prop.message ?? `${field} must be one of the allowed values.`;
        continue;
      }

      if (typeof value === 'string') {
        if (prop.minLength !== undefined && value.length < prop.minLength) {
          errors[field] = prop.message ?? `${field} must be at least ${prop.minLength} characters.`;
          continue;
        }
        if (prop.maxLength !== undefined && value.length > prop.maxLength) {
          errors[field] = prop.message ?? `${field} must be at most ${prop.maxLength} characters.`;
          continue;
        }
        const regex = compiledPatterns.get(field);
        if (regex && !regex.test(value)) {
          errors[field] = prop.message ?? `${field} does not match the required pattern.`;
          continue;
        }
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        if (prop.minimum !== undefined && value < prop.minimum) {
          errors[field] = prop.message ?? `${field} must be at least ${prop.minimum}.`;
          continue;
        }
        if (prop.maximum !== undefined && value > prop.maximum) {
          errors[field] = prop.message ?? `${field} must be at most ${prop.maximum}.`;
          continue;
        }
      }
    }

    return errors as FormErrors<Values>;
  };
}

export interface OptimisticSubmitOptions<Values extends object, Result, RollbackToken = unknown> {
  applyOptimistic: (values: Readonly<Values>) => RollbackToken;
  commit: (values: Readonly<Values>) => Result | Promise<Result>;
  rollback: (values: Readonly<Values>, error: unknown, token: RollbackToken) => void | Promise<void>;
  onSuccess?: (result: Result, values: Readonly<Values>) => void;
  onError?: (error: unknown, values: Readonly<Values>) => void;
}

export type OptimisticSubmitOutcome<Result> =
  | { readonly ok: true; readonly result: Result }
  | { readonly ok: false; readonly error: unknown };

export interface OptimisticSubmitRunner<Values extends object, Result> {
  submit(values: Readonly<Values>): Promise<OptimisticSubmitOutcome<Result>>;
  readonly pending: boolean;
  readonly lastError: unknown;
}

/**
 * Optimistic submit runner that applies state immediately, commits asynchronously,
 * and invokes rollback cleanly if the commit rejects.
 */
export function createOptimisticSubmit<Values extends object, Result, RollbackToken = unknown>(
  options: OptimisticSubmitOptions<Values, Result, RollbackToken>,
): OptimisticSubmitRunner<Values, Result> {
  let pendingCount = 0;
  let lastError: unknown;

  return {
    get pending(): boolean {
      return pendingCount > 0;
    },
    get lastError(): unknown {
      return lastError;
    },
    async submit(values: Readonly<Values>): Promise<OptimisticSubmitOutcome<Result>> {
      pendingCount += 1;
      lastError = undefined;
      let token: RollbackToken;
      try {
        token = options.applyOptimistic(values);
      } catch (error) {
        pendingCount = Math.max(0, pendingCount - 1);
        lastError = error;
        options.onError?.(error, values);
        return { ok: false, error };
      }

      try {
        const result = await options.commit(values);
        options.onSuccess?.(result, values);
        return { ok: true, result };
      } catch (error) {
        lastError = error;
        await options.rollback(values, error, token);
        options.onError?.(error, values);
        return { ok: false, error };
      } finally {
        pendingCount = Math.max(0, pendingCount - 1);
      }
    },
  };
}
