import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
let count = 0; let total = 0;
async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (entry.isDirectory()) await walk(path); else { const info = await stat(path); count++; total += info.size; if (entry.name.endsWith('.env') || entry.name === '.npmrc.local') throw new Error(`Potential secret file included: ${path}`); } } }
await walk('packages');
console.log(`Package source inventory: ${count} files, ${(total / 1024).toFixed(1)} KiB.`);
