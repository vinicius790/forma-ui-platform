import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toW3CTokens } from '../dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../dist/tokens.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(toW3CTokens(), null, 2) + '\n', 'utf-8');
