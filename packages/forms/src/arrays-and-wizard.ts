import type { FormController, FieldName } from './index';

export interface FieldArrayItem<T> {
  readonly key: string;
  value: T;
}

export interface FieldArrayOptions<T> {
  initialItems?: readonly T[];
  minLength?: number;
  maxLength?: number;
  onChange?: (items: readonly FieldArrayItem<T>[]) => void;
}

export class FieldArrayController<T> {
  private itemsList: FieldArrayItem<T>[];
  private options: FieldArrayOptions<T>;
  private seq = 0;

  constructor(options: FieldArrayOptions<T> = {}) {
    this.options = { minLength: 0, maxLength: Infinity, ...options };
    this.itemsList = (options.initialItems ?? []).map((value) => ({ key: `item-${++this.seq}`, value }));
  }

  get items(): readonly FieldArrayItem<T>[] {
    return this.itemsList;
  }

  get values(): T[] {
    return this.itemsList.map((i) => i.value);
  }

  get canAppend(): boolean {
    return this.itemsList.length < (this.options.maxLength ?? Infinity);
  }

  get canRemove(): boolean {
    return this.itemsList.length > (this.options.minLength ?? 0);
  }

  private emit(): void {
    this.options.onChange?.([...this.itemsList]);
  }

  append(value: T): boolean {
    if (!this.canAppend) return false;
    this.itemsList = [...this.itemsList, { key: `item-${++this.seq}`, value }];
    this.emit();
    return true;
  }

  prepend(value: T): boolean {
    if (!this.canAppend) return false;
    this.itemsList = [{ key: `item-${++this.seq}`, value }, ...this.itemsList];
    this.emit();
    return true;
  }

  insert(index: number, value: T): boolean {
    if (!this.canAppend) return false;
    const pos = Math.max(0, Math.min(this.itemsList.length, index));
    const next = [...this.itemsList];
    next.splice(pos, 0, { key: `item-${++this.seq}`, value });
    this.itemsList = next;
    this.emit();
    return true;
  }

  update(index: number, value: T): boolean {
    if (index < 0 || index >= this.itemsList.length) return false;
    this.itemsList = this.itemsList.map((item, i) => (i === index ? { ...item, value } : item));
    this.emit();
    return true;
  }

  remove(index: number): boolean {
    if (!this.canRemove || index < 0 || index >= this.itemsList.length) return false;
    this.itemsList = this.itemsList.filter((_, i) => i !== index);
    this.emit();
    return true;
  }

  move(from: number, to: number): boolean {
    if (from < 0 || from >= this.itemsList.length || to < 0 || to >= this.itemsList.length || from === to) return false;
    const next = [...this.itemsList];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    this.itemsList = next;
    this.emit();
    return true;
  }

  swap(a: number, b: number): boolean {
    if (a < 0 || b < 0 || a >= this.itemsList.length || b >= this.itemsList.length || a === b) return false;
    const next = [...this.itemsList];
    [next[a], next[b]] = [next[b]!, next[a]!];
    this.itemsList = next;
    this.emit();
    return true;
  }
}

export function createFieldArrayController<T>(options: FieldArrayOptions<T> = {}): FieldArrayController<T> {
  return new FieldArrayController(options);
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface FormPersistenceOptions<Values extends object> {
  key: string;
  version?: number;
  storage?: StorageLike | null;
  debounceMs?: number;
  omitFields?: readonly FieldName<Values>[];
}

export function createFormPersistence<Values extends object>(
  form: FormController<Values>,
  options: FormPersistenceOptions<Values>,
) {
  const version = options.version ?? 1;
  const storage = options.storage ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  const omit = new Set<string>(options.omitFields ?? []);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let active = true;

  const saveNow = (): boolean => {
    if (!storage || !active) return false;
    const values = form.getSnapshot().values;
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (!omit.has(k)) filtered[k] = v;
    }
    try {
      storage.setItem(options.key, JSON.stringify({ version, values: filtered }));
      return true;
    } catch {
      return false;
    }
  };

  const restore = (): boolean => {
    if (!storage || !active) return false;
    try {
      const raw = storage.getItem(options.key);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { version?: number; values?: Partial<Values> };
      if (parsed.version !== version || !parsed.values || typeof parsed.values !== 'object') return false;
      for (const [k, v] of Object.entries(parsed.values)) {
        if (!omit.has(k)) form.setFieldValue(k as FieldName<Values>, v as Values[FieldName<Values>], false);
      }
      return true;
    } catch {
      return false;
    }
  };

  const clear = (): void => {
    try {
      storage?.removeItem(options.key);
    } catch {
      // ignore storage errors
    }
  };

  const unsubscribe = form.subscribe(() => {
    if (!active) return;
    if (timer !== null) clearTimeout(timer);
    const delay = options.debounceMs ?? 250;
    if (delay <= 0) {
      saveNow();
    } else {
      timer = setTimeout(() => {
        timer = null;
        saveNow();
      }, delay);
    }
  });

  return {
    saveNow,
    restore,
    clear,
    destroy() {
      if (!active) return;
      active = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      unsubscribe();
    },
  };
}

export interface WizardStepSchema<Values extends object> {
  id: string;
  fields: readonly FieldName<Values>[];
}

export class WizardFormController<Values extends object> {
  private form: FormController<Values>;
  private steps: readonly WizardStepSchema<Values>[];
  private currentIndex = 0;

  constructor(form: FormController<Values>, steps: readonly WizardStepSchema<Values>[]) {
    this.form = form;
    this.steps = steps;
  }

  get stepIndex(): number {
    return this.currentIndex;
  }

  get currentStep(): WizardStepSchema<Values> | undefined {
    return this.steps[this.currentIndex];
  }

  get isFirst(): boolean {
    return this.currentIndex === 0;
  }

  get isLast(): boolean {
    return this.currentIndex >= this.steps.length - 1;
  }

  async nextStep(): Promise<boolean> {
    const step = this.currentStep;
    if (!step) return false;
    for (const field of step.fields) this.form.setFieldTouched(field, true, false);
    const errors = await this.form.validate();
    const hasStepErrors = step.fields.some((field) => Boolean(errors[field]));
    if (hasStepErrors) return false;
    if (!this.isLast) this.currentIndex += 1;
    return true;
  }

  prevStep(): void {
    if (this.currentIndex > 0) this.currentIndex -= 1;
  }

  goToStep(index: number): void {
    this.currentIndex = Math.max(0, Math.min(this.steps.length - 1, Math.trunc(index)));
  }
}

export function createWizardFormController<Values extends object>(
  form: FormController<Values>,
  steps: readonly WizardStepSchema<Values>[],
): WizardFormController<Values> {
  return new WizardFormController(form, steps);
}
