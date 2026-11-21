let globalCounter = 0;

export function createId(prefix = 'forma'): string {
  globalCounter += 1;
  return `${prefix}-${globalCounter}`;
}

export function resetIdCounter(): void {
  globalCounter = 0;
}
