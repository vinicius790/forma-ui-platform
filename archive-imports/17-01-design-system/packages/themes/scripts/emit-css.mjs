import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCompleteThemeCss } from '../dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../dist/styles.css');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, generateCompleteThemeCss(), 'utf-8');
