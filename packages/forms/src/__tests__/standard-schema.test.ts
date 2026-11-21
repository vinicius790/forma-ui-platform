import { describe, expect, it, vi } from 'vitest';
import { isStandardSchema, standardSchemaToValidator, validateWithStandardSchema, type StandardSchemaV1 } from '../standard-schema';

const schema: StandardSchemaV1<string, string> = {
  '~standard': {
    version: 1,
    vendor: 'forma-test',
    validate: vi.fn((value: unknown) => typeof value === 'string' && value.includes('@')
      ? { value }
      : { issues: [{ message: 'Enter a valid e-mail address.' }] }),
  },
};

describe('Standard Schema bridge', () => {
  it('detects conforming schema objects', () => {
    expect(isStandardSchema(schema)).toBe(true);
    expect(isStandardSchema({})).toBe(false);
  });
  it('returns typed successful values and structured issues', async () => {
    expect(await validateWithStandardSchema(schema, 'a@example.com')).toEqual({ valid: true, value: 'a@example.com', issues: [] });
    expect((await validateWithStandardSchema(schema, 'not-an-email')).issues[0]?.message).toContain('valid');
  });
  it('adapts schema validation to a simple field validator', async () => {
    const validator = standardSchemaToValidator(schema);
    expect(await validator('a@example.com')).toBeUndefined();
    expect(await validator('bad')).toBe('Enter a valid e-mail address.');
  });
});
