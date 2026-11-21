import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function listDeclarationFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listDeclarationFiles(full)));
    else if (entry.name.endsWith('.d.ts')) files.push(full);
  }
  return files;
}

const SPECIFIER_PATTERN = /(from\s+['"]|import\s*\(\s*['"]|import\s+['"])(\.\.?(?:\/[^'"]*)?)(['"])/gu;
const ALREADY_TYPED_OR_EXT = /\.(?:[cm]?js|json|css|d\.[cm]?ts)$/u;

async function normalizeDeclarationExtensions(content, fileDirectory) {
  const matches = [...content.matchAll(SPECIFIER_PATTERN)];
  if (!matches.length) return content;

  let output = '';
  let lastIndex = 0;
  for (const match of matches) {
    const [full, prefix, specifier, suffix] = match;
    const index = match.index ?? 0;
    output += content.slice(lastIndex, index);
    if (ALREADY_TYPED_OR_EXT.test(specifier)) {
      output += full;
    } else {
      const target = resolve(fileDirectory, specifier);
      const base = specifier === '.' || specifier === '..' ? `${specifier}/index` : specifier;
      if (specifier !== '.' && specifier !== '..' && (await exists(`${target}.d.ts`))) {
        output += `${prefix}${specifier}.js${suffix}`;
      } else if (await exists(join(target, 'index.d.ts'))) {
        output += `${prefix}${base}.js${suffix}`;
      } else {
        output += full;
      }
    }
    lastIndex = index + full.length;
  }
  output += content.slice(lastIndex);
  return output;
}

function toCommonJsDeclarations(esmContent) {
  return esmContent
    .replace(/(from\s+['"]|import\s*\(\s*['"]|import\s+['"])(\.\.?\/[^'"]+?)\.js(['"])/gu, '$1$2.cjs$3')
    .replace(/\r?\n?\/\/# sourceMappingURL=[^\r\n]+/gu, '');
}

const distDirectory = resolve(process.cwd(), 'dist');
const dtsFiles = await listDeclarationFiles(distDirectory);
for (const filePath of dtsFiles) {
  const original = await readFile(filePath, 'utf8');
  const normalized = await normalizeDeclarationExtensions(original, dirname(filePath));
  if (normalized !== original) {
    await writeFile(filePath, normalized, 'utf8');
  }
  const dctsPath = filePath.replace(/\.d\.ts$/u, '.d.cts');
  await writeFile(dctsPath, toCommonJsDeclarations(normalized), 'utf8');
}
