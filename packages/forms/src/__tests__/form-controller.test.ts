import { describe, expect, it, vi } from 'vitest';
import { createFormController } from '../index';

type Values = { email: string; age: number | ''; accepted: boolean };

const initialValues: Values = { email: '', age: '', accepted: false };

describe('FormController', () => {
  it('tracks values, dirty fields, errors and touched state', () => {
    const form = createFormController<Values>({ initialValues, onSubmit: vi.fn() });
    form.setFieldValue('email', 'person@example.com');
    form.setFieldTouched('email');
    expect(form.getSnapshot().isDirty).toBe(true);
    expect(form.getSnapshot().dirtyFields).toEqual(['email']);
    expect(form.getSnapshot().touched.email).toBe(true);
    form.setFieldError('email', 'Invalid address');
    expect(form.getFieldErrorProps('email').hidden).toBe(false);
    expect(form.getFieldProps('email')['aria-describedby']).toBe('forma-email-error');
    expect(form.getFieldProps('email', { description: true })['aria-describedby']).toBe('forma-email-description forma-email-error');
    form.setFieldError('email');
    expect(form.getFieldProps('email')['aria-describedby']).toBeUndefined();
    form.resetForm();
    expect(form.getSnapshot().isDirty).toBe(false);
    expect(form.getSnapshot().errors).toEqual({});
    form.destroy();
  });

  it('maps native number and checkbox input events into typed values', () => {
    const form = createFormController<Values>({ initialValues, onSubmit: vi.fn() });
    form.getFieldProps('age', { type: 'number' }).onChange({ currentTarget: { value: '42', type: 'number' } });
    form.getFieldProps('accepted', { type: 'checkbox' }).onChange({ currentTarget: { checked: true, type: 'checkbox' } });
    expect(form.getSnapshot().values.age).toBe(42);
    expect(form.getSnapshot().values.accepted).toBe(true);
    const radioProps = form.getFieldProps('email', { type: 'radio', value: 'radio-choice' });
    expect(radioProps.checked).toBe(false);
    radioProps.onChange({ currentTarget: { checked: true, value: 'radio-choice', type: 'radio' } });
    expect(form.getSnapshot().values.email).toBe('radio-choice');
    form.destroy();
  });

  it('does not submit invalid forms and marks all fields touched', async () => {
    const onSubmit = vi.fn();
    const form = createFormController<Values>({
      initialValues,
      validate: (values) => values.email ? {} : { email: 'Email is required' },
      onSubmit,
    });
    expect(await form.submit()).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.getSnapshot().touched.accepted).toBe(true);
    expect(form.getSnapshot().errors.email).toBe('Email is required');
    form.destroy();
  });

  it('submits valid forms and exposes helpers', async () => {
    const onSubmit = vi.fn(async (_values: Readonly<Values>, helpers) => helpers.setFieldError('email', 'Server message'));
    const form = createFormController<Values>({ initialValues: { ...initialValues, email: 'ok@example.com' }, onSubmit });
    expect(await form.submit()).toBe(true);
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(form.getSnapshot().errors.email).toBe('Server message');
    expect(form.getSnapshot().isSubmitting).toBe(false);
    form.destroy();
  });

  it('ignores stale async validation results', async () => {
    let finishFirst!: (errors: { email?: string }) => void;
    const validate = vi.fn((values: Readonly<Values>) => values.email === 'first'
      ? new Promise<{ email?: string }>((resolve) => { finishFirst = resolve; })
      : Promise.resolve({}));
    const form = createFormController<Values>({ initialValues, validate, validateOn: 'never', onSubmit: vi.fn() });
    form.setFieldValue('email', 'first', false);
    const first = form.validate();
    form.setFieldValue('email', 'second', false);
    const second = form.validate();
    await second;
    finishFirst({ email: 'Stale result' });
    await first;
    expect(form.getSnapshot().errors).toEqual({});
    form.destroy();
  });
  it('stops a pending submit cleanly when the controller is destroyed', async () => {
    let finish!: (errors: { email?: string }) => void;
    const onSubmit = vi.fn();
    const form = createFormController<Values>({
      initialValues: { ...initialValues, email: 'valid@example.com' },
      validate: () => new Promise((resolve) => { finish = resolve; }),
      onSubmit,
    });
    const pending = form.submit();
    await Promise.resolve(); // allow the async validator to start before disposal
    form.destroy();
    finish({});
    expect(await pending).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

});
