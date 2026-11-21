import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { primitiveColors, semanticColors } from '../dist/colors.js';
import { radii, shadows, zIndex, motion } from '../dist/elevation.js';
import { spacing } from '../dist/spacing.js';
import { typography } from '../dist/typography.js';
import { toDTCG } from '../dist/css-vars.js';

const root = resolve(import.meta.dirname, '..');
const shadeNamesByScale = {
  gray: ['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
  blue: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  red: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  green: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  amber: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
};
const palette = Object.fromEntries(
  Object.entries(primitiveColors).map(([name, values]) => [
    name,
    Object.fromEntries(values.map((value, index) => [shadeNamesByScale[name]?.[index] ?? String(index), value])),
  ]),
);

const tokenTree = {
  color: { primitive: palette, semantic: semanticColors },
  spacing,
  radii,
  shadows,
  zIndex,
  motion,
  typography,
};
const tokens = {
  $schema: 'https://design-tokens.github.io/community-group/format/',
  $description: 'Forma UI design tokens. Consuma apenas os grupos necessários.',
  ...toDTCG(tokenTree),
};

await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/tokens.json'), `${JSON.stringify(tokens, null, 2)}\n`);
