export type TokenPrimitive = string | number | boolean;
export type TokenTree = { [key: string]: TokenPrimitive | TokenTree };
export type DTCGType =
  | 'color'
  | 'dimension'
  | 'duration'
  | 'cubicBezier'
  | 'fontFamily'
  | 'fontWeight'
  | 'number'
  | 'shadow'
  | 'string';
export type DTCGTypeHints = Record<string, DTCGType>;

export function flattenTokens(tokens: TokenTree, prefix = ''): Record<string, TokenPrimitive> {
  const output: Record<string, TokenPrimitive> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const name = [prefix, key].filter(Boolean).join('-');
    if (value !== null && typeof value === 'object') {
      Object.assign(output, flattenTokens(value as TokenTree, name));
    } else {
      output[name] = value as TokenPrimitive;
    }
  }
  return output;
}

export function toCssVariables(tokens: TokenTree, prefix = 'forma'): string {
  const safePrefix = prefix.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase() || 'forma';
  return Object.entries(flattenTokens(tokens))
    .map(([key, value]) => {
      const safeKey = key.replace(/([A-Z])/g, '-$1').replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
      return `--${safePrefix}-${safeKey}: ${String(value)};`;
    })
    .join('\n');
}

function inferDTCGType(path: string[], value: TokenPrimitive): DTCGType {
  const segments = path.map((part) => part.toLowerCase());
  const last = segments.at(-1) ?? '';
  if (segments.includes('color')) return 'color';
  if (segments.includes('shadow') || segments.includes('shadows')) return 'shadow';
  if (segments.includes('fontfamily')) return 'fontFamily';
  if (segments.includes('fontweight')) return 'fontWeight';
  if (segments.includes('fontsize') || segments.includes('spacing') || segments.includes('radii')) return 'dimension';
  if (segments.includes('duration') || (segments.includes('motion') && ['fast', 'normal', 'slow'].includes(last))) return 'duration';
  if (segments.includes('motion') && last === 'easing') return 'cubicBezier';
  if (typeof value === 'number' || segments.includes('zindex') || segments.includes('lineheight')) return 'number';
  return 'string';
}

export function toDTCG(tokens: TokenTree, hints: DTCGTypeHints = {}): Record<string, unknown> {
  const convert = (tree: TokenTree, path: string[]): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(tree)) {
      const currentPath = [...path, key];
      if (value !== null && typeof value === 'object') {
        result[key] = convert(value as TokenTree, currentPath);
      } else {
        const pathKey = currentPath.join('.');
        result[key] = {
          $type: hints[pathKey] ?? inferDTCGType(currentPath, value as TokenPrimitive),
          $value: value,
        };
      }
    }
    return result;
  };
  return convert(tokens, []);
}
