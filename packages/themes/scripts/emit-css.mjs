import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { allThemesCss } from '../dist/index.js';

const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/styles.css'), `${allThemesCss()}\n`);
