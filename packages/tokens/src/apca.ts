/**
 * APCA-W3 (0.0.98G) perceptual luminance contrast utilities alongside WCAG 2.2 contrast.
 * Note: Automated contrast math aids design-token authoring and does not replace full WCAG evaluation.
 */

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace(/^#/u, '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/u.test(full)) throw new RangeError(`Invalid hex color: ${hex}`);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function apcaLuminance(hex: string): number {
  const [r, g, b] = parseHexRgb(hex);
  const y = 0.2126729 * Math.pow(r / 255, 2.4) + 0.7151522 * Math.pow(g / 255, 2.4) + 0.072175 * Math.pow(b / 255, 2.4);
  return y > 0.022 ? y : y + Math.pow(0.022 - y, 1.414);
}

/** Computes signed APCA Lightness Contrast (Lc) between foreground text and background hex colors. */
export function apcaContrastLc(textHex: string, backgroundHex: string): number {
  const txtY = apcaLuminance(textHex);
  const bgY = apcaLuminance(backgroundHex);
  if (Math.abs(bgY - txtY) < 0.0005) return 0;
  let sapc = 0;
  if (bgY > txtY) {
    sapc = (Math.pow(bgY, 0.56) - Math.pow(txtY, 0.57)) * 1.14;
    return sapc < 0.1 ? 0 : Math.round((sapc - 0.027) * 1000) / 10;
  }
  sapc = (Math.pow(bgY, 0.65) - Math.pow(txtY, 0.62)) * 1.14;
  return sapc > -0.1 ? 0 : Math.round((sapc + 0.027) * 1000) / 10;
}

/** Picks the candidate foreground color with the highest absolute APCA Lc against `backgroundHex`. */
export function pickAccessibleForeground(
  backgroundHex: string,
  candidates: readonly string[] = ['#0f172a', '#ffffff'],
): { color: string; lc: number } {
  let bestColor = candidates[0] ?? '#0f172a';
  let bestLc = apcaContrastLc(bestColor, backgroundHex);
  for (const candidate of candidates.slice(1)) {
    const lc = apcaContrastLc(candidate, backgroundHex);
    if (Math.abs(lc) > Math.abs(bestLc)) {
      bestColor = candidate;
      bestLc = lc;
    }
  }
  return { color: bestColor, lc: bestLc };
}
