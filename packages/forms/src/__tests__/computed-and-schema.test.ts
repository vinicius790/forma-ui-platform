import { describe, expect, it, vi } from 'vitest';
import {
  createComputedFieldsEngine,
  createFormController,
  createJsonSchemaFormValidator,
  createOptimisticSubmit,
} from '../index';

describe('forms v50 extensions', () => {
  it('propagates computed fields, guards against cycles, and cleans up idempotently', () => {
    const form = createFormController({
      initialValues: { price: 10, qty: 2, subtotal: 0, total: 0, note: '' },
      onSubmit: vi.fn(),
    });
    const subtotalSpy = vi.fn((values: Readonly<{ price: number; qty: number }>) => values.price * values.qty);
    const engine = createComputedFieldsEngine(form, [
      { target: 'subtotal', sources: ['price', 'qty'], compute: subtotalSpy },
      { target: 'total', sources: ['subtotal'], compute: (v) => v.subtotal + 5 },
    ]);

    form.setFieldValue('note', 'ignored');
    expect(subtotalSpy).not.toHaveBeenCalled();

    form.setFieldValue('price', 20);
    expect(subtotalSpy).toHaveBeenCalledTimes(1);
    expect(form.getSnapshot().values.subtotal).toBe(40);
    expect(form.getSnapshot().values.total).toBe(45);

    engine.destroy();
    engine.destroy();
    form.setFieldValue('qty', 5);
    expect(form.getSnapshot().values.subtotal).toBe(40);
    form.destroy();

    const cyclic = createFormController({ initialValues: { a: 0, b: 0 }, onSubmit: vi.fn() });
    const cyclicEngine = createComputedFieldsEngine(
      cyclic,
      [
        { target: 'a', sources: ['b'], compute: (v) => v.b + 1 },
        { target: 'b', sources: ['a'], compute: (v) => v.a + 1 },
      ],
      { maxIterations: 3 },
    );
    cyclic.setFieldValue('a', 1);
    expect(cyclic.getSnapshot().values.a).toBeLessThanOrEqual(5);
    cyclicEngine.destroy();
    cyclic.destroy();
  });

  it('validates JSON Schema subsets and integrates with FormController', async () => {
    type Values = { username: string; age: number | ''; role: string };
    const validate = createJsonSchemaFormValidator<Values>({
      type: 'object',
      required: ['username', 'role'],
      properties: {
        username: { type: 'string', minLength: 3, maxLength: 10, pattern: '^[a-z0-9_]+$' },
        age: { type: 'integer', minimum: 18, maximum: 99 },
        role: { type: 'string', enum: ['admin', 'user'] },
      },
    });

    expect(validate({ username: '', age: 15, role: 'guest' })).toEqual({
      username: expect.any(String),
      age: expect.any(String),
      role: expect.any(String),
    });
    expect(validate({ username: 'ok_1', age: 25, role: 'admin' })).toEqual({});

    const form = createFormController<Values>({
      initialValues: { username: 'ab', age: 20, role: 'user' },
      validate,
      onSubmit: vi.fn(),
    });
    expect(await form.submit()).toBe(false);
    expect(form.getSnapshot().errors.username).toBeTruthy();
    form.setFieldValue('username', 'valid_name');
    expect(await form.submit()).toBe(true);
    form.destroy();
  });

  it('applies optimistic state immediately and rolls back cleanly on rejection', async () => {
    let state = 'initial';
    const runner = createOptimisticSubmit<{ name: string }, { ok: boolean }, string>({
      applyOptimistic: (values) => {
        const previous = state;
        state = values.name;
        return previous;
      },
      commit: async (values) => {
        if (values.name === 'fail') throw new Error('commit rejected');
        return { ok: true };
      },
      rollback: (_values, _error, previous) => {
        state = previous;
      },
    });

    const successPromise = runner.submit({ name: 'saved' });
    expect(state).toBe('saved');
    expect(runner.pending).toBe(true);
    expect(await successPromise).toEqual({ ok: true, result: { ok: true } });
    expect(runner.pending).toBe(false);

    const failPromise = runner.submit({ name: 'fail' });
    expect(state).toBe('fail');
    const failed = await failPromise;
    expect(failed.ok).toBe(false);
    expect(state).toBe('saved');
    expect(runner.pending).toBe(false);
  });
});
