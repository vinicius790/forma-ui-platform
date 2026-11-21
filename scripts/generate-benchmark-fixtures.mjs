import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

const root = process.cwd();
const outputRoot = resolve(root, 'fixtures/benchmarks');
const VERSION = '100.0.0';

const departments = ['engineering', 'design', 'product', 'support', 'security', 'research', 'operations', 'finance'];
const statuses = ['active', 'pending', 'suspended', 'archived'];
const regions = ['br-north', 'br-northeast', 'br-central-west', 'br-southeast', 'br-south', 'na-east', 'eu-west', 'ap-southeast'];
const commandGroups = ['navigation', 'records', 'editing', 'workspace', 'accessibility', 'developer-tools', 'help'];
const virtualizationSections = ['Overview', 'Properties', 'Interactions', 'Accessibility', 'Examples', 'References'];
const aiModels = ['forma-stream-fast', 'forma-stream-pro', 'forma-agent-v100', 'forma-a11y-auditor'];
const aiPhases = ['streaming', 'tool-approval', 'complete', 'aborted'];
const crdtOps = ['lww-set', 'lww-delete', 'presence-cursor', 'presence-selection'];
const treeNodes = ['workspace', 'package', 'controller', 'primitive', 'story', 'spec'];
const locales = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-EG', 'he-IL', 'ja-JP'];
const chartMetrics = ['inp-latency-ms', 'lcp-render-ms', 'cls-score', 'memory-heap-kb', 'virtual-fps', 'a11y-tree-depth'];
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

let existingByPath = new Map();
try {
  const prev = JSON.parse(await readFile(join(outputRoot, 'manifest.json'), 'utf8'));
  for (const entry of prev.generatedDatasets ?? []) existingByPath.set(entry.path, entry);
} catch {
  existingByPath = new Map();
}

function token(seed, length = 24) {
  let value = seed >>> 0;
  let output = '';
  for (let index = 0; index < length; index += 1) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    output += alphabet[value % alphabet.length];
  }
  return output;
}

function isoDate(index, offset = 0) {
  const base = Date.UTC(2022, 0, 1) + ((index * 7919 + offset * 104729) % (4 * 365 * 24 * 60 * 60 * 1000));
  return new Date(base).toISOString();
}

async function writeJsonl(relativePath, count, createRecord, progressLabel) {
  const path = join(outputRoot, relativePath);
  const cached = existingByPath.get(relativePath);
  if (cached && cached.records === count && existsSync(path)) {
    const info = await stat(path);
    if (info.size === cached.bytes) {
      process.stdout.write(`${progressLabel} -> ${relativePath}: cached (${(cached.bytes / (1024 * 1024)).toFixed(2)} MiB)\n`);
      return cached;
    }
  }
  await mkdir(dirname(path), { recursive: true });
  await rm(path, { force: true });
  const stream = createWriteStream(path, { flags: 'wx', encoding: 'utf8', highWaterMark: 4 * 1024 * 1024 });
  const hash = createHash('sha256');
  let bytes = 0;
  let firstId = null;
  let lastId = null;
  const batchSize = 2500;
  for (let start = 0; start < count; start += batchSize) {
    let batch = '';
    const end = Math.min(count, start + batchSize);
    for (let index = start; index < end; index += 1) {
      const value = createRecord(index);
      firstId ??= value.id ?? null;
      lastId = value.id ?? lastId;
      batch += `${JSON.stringify(value)}\n`;
    }
    const buffer = Buffer.from(batch, 'utf8');
    hash.update(buffer);
    bytes += buffer.byteLength;
    if (!stream.write(buffer)) await once(stream, 'drain');
  }
  stream.end();
  await once(stream, 'close');
  process.stdout.write(`${progressLabel} -> ${relativePath}: ${count.toLocaleString('en-US')} records (${(bytes / (1024 * 1024)).toFixed(2)} MiB)\n`);
  return { path: relativePath, records: count, bytes, sha256: hash.digest('hex'), format: 'jsonl', firstId, lastId };
}

const repeatedDescription = 'Synthetic benchmark fixture only. Use this deterministic record to exercise sorting, filtering, selection, pagination, keyboard navigation, row virtualization, server-side query simulation and memory profiling. No real person or business is represented.';

await mkdir(outputRoot, { recursive: true });
const generated = [];

// 1. Data Grid (10 shards x 120k = 1.2M records, ~765 MB)
for (let s = 1; s <= 10; s += 1) {
  const start = (s - 1) * 120_000 + 1;
  generated.push(await writeJsonl(`data-grid/records-part-${s}.jsonl`, 120_000, (index) => {
    const number = index + start;
    return {
      id: `grid-${String(number).padStart(7, '0')}`,
      name: `Synthetic record ${String(number).padStart(7, '0')}`,
      email: `benchmark-user-${String(number).padStart(7, '0')}@example.test`,
      department: departments[(number * 7) % departments.length],
      status: statuses[(number * 13) % statuses.length],
      priority: (number * 17) % 6,
      amountMinor: (number * 7919) % 25_000_000,
      region: regions[(number * 11) % regions.length],
      createdAt: isoDate(number),
      updatedAt: isoDate(number, 1),
      tags: [`segment-${number % 23}`, `cohort-${number % 41}`, `facet-${number % 17}`],
      token: token(number * 2654435761, 32),
      description: repeatedDescription,
    };
  }, `Data Grid ${s}/10`));
}

// 2. Command Palette (5 shards x 150k = 750k commands, ~303 MB)
for (const shard of [
  { file: 'command-palette/commands-150k.jsonl', start: 1 },
  { file: 'command-palette/commands-part-2.jsonl', start: 150_001 },
  { file: 'command-palette/commands-part-3.jsonl', start: 300_001 },
  { file: 'command-palette/commands-part-4.jsonl', start: 450_001 },
  { file: 'command-palette/commands-part-5.jsonl', start: 600_001 },
]) {
  generated.push(await writeJsonl(shard.file, 150_000, (index) => {
    const number = index + shard.start;
    const group = commandGroups[(number * 5) % commandGroups.length];
    return {
      id: `command-${String(number).padStart(7, '0')}`,
      title: `Command ${String(number).padStart(7, '0')} — ${group}`,
      group,
      keywords: [`keyword-${number % 101}`, `action-${number % 67}`, `scope-${number % 29}`],
      shortcut: number % 5 === 0 ? `Ctrl+Shift+${number % 10}` : null,
      enabled: number % 19 !== 0,
      rank: (number * 104729) % 1_000_003,
      description: `Deterministic command-palette search fixture for fuzzy matching, prefix ranking, disabled states, keyboard selection, recent items and large result sets. Record ${number}.`,
      token: token(number * 2246822519, 28),
    };
  }, 'Command Palette'));
}

// 3. Virtualization (5 shards x 100k = 500k rows, ~254 MB)
for (const shard of [
  { file: 'virtualization/variable-height-rows-100k.jsonl', start: 1 },
  { file: 'virtualization/variable-height-rows-part-2.jsonl', start: 100_001 },
  { file: 'virtualization/variable-height-rows-part-3.jsonl', start: 200_001 },
  { file: 'virtualization/variable-height-rows-part-4.jsonl', start: 300_001 },
  { file: 'virtualization/variable-height-rows-part-5.jsonl', start: 400_001 },
]) {
  generated.push(await writeJsonl(shard.file, 100_000, (index) => {
    const number = index + shard.start;
    return {
      id: `virtual-row-${String(number).padStart(7, '0')}`,
      index,
      estimatedHeight: 28 + ((number * 37) % 173),
      section: virtualizationSections[(number * 3) % virtualizationSections.length],
      heading: `Virtualized content block ${String(number).padStart(7, '0')}`,
      expanded: number % 11 === 0,
      selectable: number % 13 !== 0,
      body: `Synthetic variable-height row ${number}: ${repeatedDescription}`,
      checksumToken: token(number * 3266489917, 20),
    };
  }, 'Virtualization'));
}

// 4. AI-UI Streaming & Tool Approvals (4 shards x 120k = 480k records, ~274 MB)
for (let s = 1; s <= 4; s += 1) {
  const start = (s - 1) * 120_000 + 1;
  generated.push(await writeJsonl(`ai-streams/stream-events-part-${s}.jsonl`, 120_000, (index) => {
    const number = index + start;
    return {
      id: `ai-evt-${String(number).padStart(7, '0')}`,
      sessionId: `session-${String((number % 4096) + 1).padStart(5, '0')}`,
      model: aiModels[number % aiModels.length],
      phase: aiPhases[(number * 3) % aiPhases.length],
      chunkIndex: number % 128,
      citations: [`cite-${(number % 19) + 1}`, `cite-${((number + 7) % 19) + 1}`],
      requiresApproval: number % 17 === 0,
      timestamp: isoDate(number, 2),
      payload: `Deterministic synthetic streaming response chunk ${number}. ${repeatedDescription}`,
      token: token(number * 1103515245, 24),
    };
  }, `AI Streams ${s}/4`));
}

// 5. CRDT Multiplayer Operations (4 shards x 150k = 600k records, ~204 MB)
for (let s = 1; s <= 4; s += 1) {
  const start = (s - 1) * 150_000 + 1;
  generated.push(await writeJsonl(`crdt-ops/lww-ops-part-${s}.jsonl`, 150_000, (index) => {
    const number = index + start;
    return {
      id: `crdt-op-${String(number).padStart(7, '0')}`,
      peerId: `peer-${String((number % 512) + 1).padStart(4, '0')}`,
      clock: number,
      opType: crdtOps[number % crdtOps.length],
      key: `field-${number % 256}`,
      x: (number * 29) % 1920,
      y: (number * 43) % 1080,
      timestamp: isoDate(number, 3),
      payload: `Synthetic Lamport-clock LWW CRDT merge operation ${number} for conflict-free collaborative UI state benchmarking and deterministic replay.`,
      token: token(number * 214013, 24),
    };
  }, `CRDT Ops ${s}/4`));
}

// 6. Tree Hierarchy, Kanban & Timeline Events (4 shards x 120k = 480k records, ~242 MB)
for (let s = 1; s <= 4; s += 1) {
  const start = (s - 1) * 120_000 + 1;
  generated.push(await writeJsonl(`tree-hierarchy/nodes-part-${s}.jsonl`, 120_000, (index) => {
    const number = index + start;
    const level = (number % 6) + 1;
    return {
      id: `tree-node-${String(number).padStart(7, '0')}`,
      parentId: level === 1 ? null : `tree-node-${String(Math.max(1, number - level)).padStart(7, '0')}`,
      level,
      kind: treeNodes[number % treeNodes.length],
      expanded: number % 5 === 0,
      startMinute: (number * 15) % 1380,
      durationMinutes: 15 + ((number * 7) % 60),
      summary: `Synthetic hierarchical TreeGrid, Kanban and Timeline node ${number}. ${repeatedDescription}`,
      token: token(number * 16807, 24),
    };
  }, `Tree Hierarchy ${s}/4`));
}

// 7. i18n ICU Message & Bidi Catalogs (2 shards x 140k = 280k records, ~145 MB)
for (let s = 1; s <= 2; s += 1) {
  const start = (s - 1) * 140_000 + 1;
  generated.push(await writeJsonl(`i18n-catalogs/messages-part-${s}.jsonl`, 140_000, (index) => {
    const number = index + start;
    const locale = locales[number % locales.length];
    const dir = locale.startsWith('ar') || locale.startsWith('he') ? 'rtl' : 'ltr';
    return {
      id: `i18n-msg-${String(number).padStart(7, '0')}`,
      locale,
      direction: dir,
      namespace: commandGroups[number % commandGroups.length],
      icuTemplate: `{count, plural, =0 {Zero items in ${locale}} one {# item in ${locale}} other {# items in ${locale}}}`,
      description: `Synthetic ICU plural/select localization benchmark record ${number} for bidirectional RTL/LTR layout and message catalog lookup. ${repeatedDescription}`,
      token: token(number * 48271, 24),
    };
  }, `i18n Catalogs ${s}/2`));
}

// 8. Accessible Charts & Sonification Timeseries (2 shards x 140k = 280k records, ~145 MB)
for (let s = 1; s <= 2; s += 1) {
  const start = (s - 1) * 140_000 + 1;
  generated.push(await writeJsonl(`chart-timeseries/series-part-${s}.jsonl`, 140_000, (index) => {
    const number = index + start;
    const value = ((number * 997) % 10000) / 100;
    return {
      id: `chart-pt-${String(number).padStart(7, '0')}`,
      metric: chartMetrics[number % chartMetrics.length],
      region: regions[number % regions.length],
      value,
      frequencyHz: Math.round((261.63 * Math.pow(4, value / 100)) * 100) / 100,
      timestamp: isoDate(number, 4),
      summary: `Synthetic accessible chart timeseries & audio sonification point ${number} for keyboard data-point roving navigation and tabular screen-reader fallback. ${repeatedDescription}`,
      token: token(number * 69621, 24),
    };
  }, `Chart Timeseries ${s}/2`));
}

const schemaFiles = [
  ['schemas/data-grid-record.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/data-grid-record.schema.json',
    title: 'Forma UI synthetic Data Grid benchmark record', type: 'object', additionalProperties: false,
    required: ['id', 'name', 'email', 'department', 'status', 'priority', 'amountMinor', 'region', 'createdAt', 'updatedAt', 'tags', 'token', 'description'],
    properties: {
      id: { type: 'string', pattern: '^grid-[0-9]{7}$' }, name: { type: 'string' }, email: { type: 'string', format: 'email' },
      department: { enum: departments }, status: { enum: statuses }, priority: { type: 'integer', minimum: 0, maximum: 5 },
      amountMinor: { type: 'integer', minimum: 0 }, region: { enum: regions }, createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }, tags: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
      token: { type: 'string', minLength: 32, maxLength: 32 }, description: { type: 'string' },
    },
  }],
  ['schemas/command.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/command.schema.json',
    title: 'Forma UI synthetic Command Palette benchmark item', type: 'object', additionalProperties: false,
    required: ['id', 'title', 'group', 'keywords', 'enabled', 'rank', 'description', 'token'],
    properties: {
      id: { type: 'string', pattern: '^command-[0-9]{7}$' }, title: { type: 'string' }, group: { enum: commandGroups },
      keywords: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } }, shortcut: { type: ['string', 'null'] },
      enabled: { type: 'boolean' }, rank: { type: 'integer' }, description: { type: 'string' }, token: { type: 'string', minLength: 28, maxLength: 28 },
    },
  }],
  ['schemas/virtual-row.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/virtual-row.schema.json',
    title: 'Forma UI synthetic variable-height virtualization row', type: 'object', additionalProperties: false,
    required: ['id', 'index', 'estimatedHeight', 'section', 'heading', 'expanded', 'selectable', 'body', 'checksumToken'],
    properties: {
      id: { type: 'string', pattern: '^virtual-row-[0-9]{7}$' }, index: { type: 'integer', minimum: 0 },
      estimatedHeight: { type: 'integer', minimum: 28, maximum: 200 }, section: { enum: virtualizationSections },
      heading: { type: 'string' }, expanded: { type: 'boolean' }, selectable: { type: 'boolean' }, body: { type: 'string' },
      checksumToken: { type: 'string', minLength: 20, maxLength: 20 },
    },
  }],
  ['schemas/ai-stream.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/ai-stream.schema.json',
    title: 'Forma UI synthetic AI-UI stream event', type: 'object', additionalProperties: false,
    required: ['id', 'sessionId', 'model', 'phase', 'chunkIndex', 'citations', 'requiresApproval', 'timestamp', 'payload', 'token'],
    properties: {
      id: { type: 'string', pattern: '^ai-evt-[0-9]{7}$' }, sessionId: { type: 'string' }, model: { enum: aiModels },
      phase: { enum: aiPhases }, chunkIndex: { type: 'integer', minimum: 0 }, citations: { type: 'array', items: { type: 'string' } },
      requiresApproval: { type: 'boolean' }, timestamp: { type: 'string', format: 'date-time' }, payload: { type: 'string' },
      token: { type: 'string', minLength: 24, maxLength: 24 },
    },
  }],
  ['schemas/crdt-op.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/crdt-op.schema.json',
    title: 'Forma UI synthetic CRDT operation record', type: 'object', additionalProperties: false,
    required: ['id', 'peerId', 'clock', 'opType', 'key', 'x', 'y', 'timestamp', 'payload', 'token'],
    properties: {
      id: { type: 'string', pattern: '^crdt-op-[0-9]{7}$' }, peerId: { type: 'string' }, clock: { type: 'integer', minimum: 1 },
      opType: { enum: crdtOps }, key: { type: 'string' }, x: { type: 'integer' }, y: { type: 'integer' },
      timestamp: { type: 'string', format: 'date-time' }, payload: { type: 'string' }, token: { type: 'string', minLength: 24, maxLength: 24 },
    },
  }],
  ['schemas/tree-node.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/tree-node.schema.json',
    title: 'Forma UI synthetic TreeGrid/Kanban/Timeline node', type: 'object', additionalProperties: false,
    required: ['id', 'parentId', 'level', 'kind', 'expanded', 'startMinute', 'durationMinutes', 'summary', 'token'],
    properties: {
      id: { type: 'string', pattern: '^tree-node-[0-9]{7}$' }, parentId: { type: ['string', 'null'] },
      level: { type: 'integer', minimum: 1, maximum: 6 }, kind: { enum: treeNodes }, expanded: { type: 'boolean' },
      startMinute: { type: 'integer', minimum: 0 }, durationMinutes: { type: 'integer', minimum: 1 },
      summary: { type: 'string' }, token: { type: 'string', minLength: 24, maxLength: 24 },
    },
  }],
  ['schemas/i18n-message.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/i18n-message.schema.json',
    title: 'Forma UI synthetic i18n ICU message benchmark record', type: 'object', additionalProperties: false,
    required: ['id', 'locale', 'direction', 'namespace', 'icuTemplate', 'description', 'token'],
    properties: {
      id: { type: 'string', pattern: '^i18n-msg-[0-9]{7}$' }, locale: { enum: locales }, direction: { enum: ['ltr', 'rtl'] },
      namespace: { enum: commandGroups }, icuTemplate: { type: 'string' }, description: { type: 'string' },
      token: { type: 'string', minLength: 24, maxLength: 24 },
    },
  }],
  ['schemas/chart-point.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://forma-ui.dev/schemas/chart-point.schema.json',
    title: 'Forma UI synthetic accessible chart & sonification point', type: 'object', additionalProperties: false,
    required: ['id', 'metric', 'region', 'value', 'frequencyHz', 'timestamp', 'summary', 'token'],
    properties: {
      id: { type: 'string', pattern: '^chart-pt-[0-9]{7}$' }, metric: { enum: chartMetrics }, region: { enum: regions },
      value: { type: 'number' }, frequencyHz: { type: 'number' }, timestamp: { type: 'string', format: 'date-time' },
      summary: { type: 'string' }, token: { type: 'string', minLength: 24, maxLength: 24 },
    },
  }],
];

for (const [relativePath, content] of schemaFiles) {
  const path = join(outputRoot, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
}

const totalBytes = generated.reduce((sum, entry) => sum + entry.bytes, 0);
const totalRecords = generated.reduce((sum, entry) => sum + entry.records, 0);

const manifest = {
  schemaVersion: 3,
  fixtureVersion: VERSION,
  generator: 'scripts/generate-benchmark-fixtures.mjs',
  deterministic: true,
  personalData: false,
  syntheticEmailDomain: 'example.test',
  generatedDatasets: generated,
  summary: {
    datasetCount: generated.length,
    records: totalRecords,
    bytes: totalBytes,
  },
  usage: {
    verify: 'node scripts/verify-benchmark-fixtures.mjs',
    benchmark: 'node scripts/benchmark-fixtures.mjs',
    regenerate: 'node scripts/generate-benchmark-fixtures.mjs',
    note: 'Datasets are intentionally line-oriented and sharded below 100,000,000 bytes each for streaming audits and repository compatibility.',
  },
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stdout.write(`\nGenerated ${generated.length} JSONL benchmark datasets (${totalRecords.toLocaleString('en-US')} records; ${totalBytes.toLocaleString('en-US')} bytes / ${(totalBytes / (1024 * 1024 * 1024)).toFixed(3)} GiB).\n`);
