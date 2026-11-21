let fallbackSequence = 0;

/** Deterministic per-instance ID factory. Supply an application/useId seed during SSR. */
export function createIdFactory(seed = 'forma'): (part?: string) => string {
  let sequence = 0;
  return (part = 'id') => `${sanitize(seed)}-${sanitize(part)}-${++sequence}`;
}

export function createId(part = 'id', seed = 'forma'): string {
  fallbackSequence += 1;
  return `${sanitize(seed)}-${sanitize(part)}-${fallbackSequence}`;
}

function sanitize(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'id';
}
