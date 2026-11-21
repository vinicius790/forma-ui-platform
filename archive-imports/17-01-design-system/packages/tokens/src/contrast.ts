/**
 * Calculadora de luminância relativa e razão de contraste WCAG 2.1 (Seção 1.4.3 e 1.4.6).
 * Garante matematicamente que tokens de temas atendam aos níveis AA (4.5:1) e AAA (7:1).
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseHexColor(hex: string): RGB {
  const cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0]! + cleaned[0]!, 16);
    const g = parseInt(cleaned[1]! + cleaned[1]!, 16);
    const b = parseInt(cleaned[2]! + cleaned[2]!, 16);
    return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
  }
  throw new Error(`Formato hexadecimal de cor inválido: "${hex}"`);
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = parseHexColor(hex);
  const transform = (channel: number): number => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  const R = transform(r);
  const G = transform(g);
  const B = transform(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lum1 = getRelativeLuminance(foregroundHex);
  const lum2 = getRelativeLuminance(backgroundHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export interface WcagContrastEvaluation {
  ratio: number;
  passesAA: boolean;
  passesAALargeText: boolean;
  passesAAA: boolean;
  passesAAALargeText: boolean;
  passesUIComponent: boolean;
}

export function evaluateWcagContrast(
  foregroundHex: string,
  backgroundHex: string
): WcagContrastEvaluation {
  const ratio = getContrastRatio(foregroundHex, backgroundHex);
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALargeText: ratio >= 3.0,
    passesAAA: ratio >= 7.0,
    passesAAALargeText: ratio >= 4.5,
    passesUIComponent: ratio >= 3.0
  };
}
