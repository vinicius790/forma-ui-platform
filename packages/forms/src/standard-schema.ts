export interface StandardSchemaIssue {
  readonly message: string;
  readonly path?: readonly (string | number | { key: string | number })[];
}
export interface StandardSchemaResult<Output> {
  readonly value?: Output;
  readonly issues?: readonly StandardSchemaIssue[];
}
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output };
  };
}
export interface StandardSchemaValidation<Output> {
  readonly valid: boolean;
  readonly value?: Output;
  readonly issues: readonly StandardSchemaIssue[];
}

export function isStandardSchema<Input = unknown, Output = Input>(value: unknown): value is StandardSchemaV1<Input, Output> {
  if (!value || typeof value !== 'object') return false;
  const standard = (value as { '~standard'?: unknown })['~standard'];
  if (!standard || typeof standard !== 'object') return false;
  const candidate = standard as { version?: unknown; validate?: unknown };
  return candidate.version === 1 && typeof candidate.validate === 'function';
}

/** Adapter for Zod, Valibot, ArkType and other Standard Schema V1 implementations. */
export async function validateWithStandardSchema<Input, Output>(
  schema: StandardSchemaV1<Input, Output>,
  input: Input,
): Promise<StandardSchemaValidation<Output>> {
  const result = await schema['~standard'].validate(input);
  const issues = result.issues ?? [];
  return issues.length
    ? { valid: false, issues }
    : { valid: true, value: result.value as Output, issues: [] };
}

export function standardSchemaToValidator<Input, Output>(schema: StandardSchemaV1<Input, Output>) {
  return async (value: Input): Promise<string | undefined> => {
    const result = await validateWithStandardSchema(schema, value);
    return result.issues[0]?.message;
  };
}
