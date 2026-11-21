import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

const manifest = JSON.parse(await readFile(resolve('fixtures/benchmarks/manifest.json'), 'utf8'));
const errors = [];
let totalBytes = 0;
let totalRecords = 0;

function validateRecord(datasetPath, record, lineNumber, expectedId) {
  const fail = (message) => errors.push(`${datasetPath}: record ${lineNumber}: ${message}`);
  if (record.id !== expectedId) fail(`id sequence mismatch (${record.id} !== ${expectedId})`);
  if (datasetPath.startsWith('data-grid/')) {
    if (typeof record.name !== 'string' || typeof record.email !== 'string') fail('name/email must be strings');
    if (!/^benchmark-user-[0-9]{7}@example\.test$/u.test(record.email)) fail('email must use deterministic reserved example.test address');
    if (!['engineering', 'design', 'product', 'support', 'security', 'research', 'operations', 'finance'].includes(record.department)) fail('invalid department');
    if (!['active', 'pending', 'suspended', 'archived'].includes(record.status)) fail('invalid status');
    if (!Number.isInteger(record.priority) || record.priority < 0 || record.priority > 5) fail('invalid priority');
    if (!Number.isInteger(record.amountMinor) || record.amountMinor < 0) fail('invalid amountMinor');
    if (!Array.isArray(record.tags) || record.tags.length !== 3) fail('tags must contain exactly three entries');
    if (!['br-north', 'br-northeast', 'br-central-west', 'br-southeast', 'br-south', 'na-east', 'eu-west', 'ap-southeast'].includes(record.region)) fail('invalid region');
    if (!Number.isFinite(Date.parse(record.createdAt)) || !Number.isFinite(Date.parse(record.updatedAt))) fail('invalid dates');
    if (typeof record.token !== 'string' || record.token.length !== 32) fail('invalid deterministic token');
    if (typeof record.description !== 'string') fail('description must be a string');
  } else if (datasetPath.startsWith('command-palette/')) {
    if (typeof record.title !== 'string' || !['navigation', 'records', 'editing', 'workspace', 'accessibility', 'developer-tools', 'help'].includes(record.group)) fail('invalid title/group');
    if (!Array.isArray(record.keywords) || record.keywords.length !== 3) fail('keywords must contain three entries');
    if (typeof record.enabled !== 'boolean' || !Number.isInteger(record.rank)) fail('invalid enabled/rank');
    if (typeof record.shortcut !== 'string' && record.shortcut !== null) fail('shortcut must be string or null');
    if (typeof record.description !== 'string' || typeof record.token !== 'string' || record.token.length !== 28) fail('invalid description/token');
  } else if (datasetPath.startsWith('virtualization/')) {
    if (!Number.isInteger(record.index) || record.index !== lineNumber - 1) fail('index must be sequential and zero-based');
    if (!Number.isInteger(record.estimatedHeight) || record.estimatedHeight < 28 || record.estimatedHeight > 200) fail('estimatedHeight out of range');
    if (typeof record.expanded !== 'boolean' || typeof record.selectable !== 'boolean') fail('expanded/selectable must be booleans');
    if (!['Overview', 'Properties', 'Interactions', 'Accessibility', 'Examples', 'References'].includes(record.section)) fail('invalid section');
    if (typeof record.body !== 'string' || typeof record.checksumToken !== 'string' || record.checksumToken.length !== 20) fail('invalid body/checksumToken');
  } else if (datasetPath.startsWith('ai-streams/')) {
    if (!['forma-stream-fast', 'forma-stream-pro', 'forma-agent-v100', 'forma-a11y-auditor'].includes(record.model)) fail('invalid model');
    if (!['streaming', 'tool-approval', 'complete', 'aborted'].includes(record.phase)) fail('invalid phase');
    if (typeof record.requiresApproval !== 'boolean' || !Array.isArray(record.citations)) fail('invalid approval/citations');
    if (typeof record.token !== 'string' || record.token.length !== 24) fail('invalid token');
  } else if (datasetPath.startsWith('crdt-ops/')) {
    if (!['lww-set', 'lww-delete', 'presence-cursor', 'presence-selection'].includes(record.opType)) fail('invalid opType');
    if (!Number.isInteger(record.clock) || record.clock < 1) fail('invalid clock');
    if (typeof record.token !== 'string' || record.token.length !== 24) fail('invalid token');
  } else if (datasetPath.startsWith('tree-hierarchy/')) {
    if (!Number.isInteger(record.level) || record.level < 1 || record.level > 6) fail('invalid level');
    if (!['workspace', 'package', 'controller', 'primitive', 'story', 'spec'].includes(record.kind)) fail('invalid kind');
    if (typeof record.token !== 'string' || record.token.length !== 24) fail('invalid token');
  } else if (datasetPath.startsWith('i18n-catalogs/')) {
    if (!['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-EG', 'he-IL', 'ja-JP'].includes(record.locale)) fail('invalid locale');
    if (!['ltr', 'rtl'].includes(record.direction)) fail('invalid direction');
    if (typeof record.icuTemplate !== 'string' || typeof record.token !== 'string' || record.token.length !== 24) fail('invalid icuTemplate/token');
  } else if (datasetPath.startsWith('chart-timeseries/')) {
    if (!['inp-latency-ms', 'lcp-render-ms', 'cls-score', 'memory-heap-kb', 'virtual-fps', 'a11y-tree-depth'].includes(record.metric)) fail('invalid metric');
    if (typeof record.value !== 'number' || typeof record.frequencyHz !== 'number') fail('invalid value/frequencyHz');
    if (typeof record.token !== 'string' || record.token.length !== 24) fail('invalid token');
  } else {
    fail('unknown dataset category');
  }
}

const schemaPaths = [
  'schemas/data-grid-record.schema.json',
  'schemas/command.schema.json',
  'schemas/virtual-row.schema.json',
  'schemas/ai-stream.schema.json',
  'schemas/crdt-op.schema.json',
  'schemas/tree-node.schema.json',
  'schemas/i18n-message.schema.json',
  'schemas/chart-point.schema.json',
];
const schemas = new Map();
for (const schemaPath of schemaPaths) {
  try {
    const schema = JSON.parse(await readFile(resolve('fixtures/benchmarks', schemaPath), 'utf8'));
    if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${schemaPath}: unsupported JSON Schema dialect`);
    if (!Array.isArray(schema.required) || !schema.properties || typeof schema.properties !== 'object') errors.push(`${schemaPath}: incomplete schema`);
    schemas.set(schemaPath, schema);
  } catch (error) { errors.push(`${schemaPath}: ${error instanceof Error ? error.message : String(error)}`); }
}

for (const dataset of manifest.generatedDatasets ?? []) {
  const path = resolve('fixtures/benchmarks', dataset.path);
  const hash = createHash('sha256');
  let bytes = 0;
  let records = 0;
  let firstId = null;
  let lastId = null;
  const match = /^(.*-)(\d+)$/.exec(dataset.firstId ?? '');
  if (!match) errors.push(`${dataset.path}: manifest firstId is invalid`);
  const prefix = match?.[1] ?? '';
  const sequenceStart = Number(match?.[2] ?? 0);
  try {
    const stream = createReadStream(path);
    stream.on('data', (chunk) => { hash.update(chunk); bytes += chunk.length; });
    const lines = createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of lines) {
      if (!line) { errors.push(`${dataset.path}: empty line at record ${records + 1}`); continue; }
      let record;
      try { record = JSON.parse(line); }
      catch { errors.push(`${dataset.path}: invalid JSON at record ${records + 1}`); continue; }
      const expectedId = `${prefix}${String(sequenceStart + records).padStart(match?.[2].length ?? 7, '0')}`;
      validateRecord(dataset.path, record, records + 1, expectedId);
      if (records === 0) firstId = record.id;
      lastId = record.id;
      records += 1;
    }
  } catch (error) {
    errors.push(`${dataset.path}: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }
  const digest = hash.digest('hex');
  if (records !== dataset.records) errors.push(`${dataset.path}: record count mismatch (${records} !== ${dataset.records})`);
  if (bytes !== dataset.bytes) errors.push(`${dataset.path}: byte count mismatch (${bytes} !== ${dataset.bytes})`);
  if (digest !== dataset.sha256) errors.push(`${dataset.path}: SHA-256 mismatch`);
  if (firstId !== dataset.firstId) errors.push(`${dataset.path}: firstId mismatch`);
  if (lastId !== dataset.lastId) errors.push(`${dataset.path}: lastId mismatch`);
  if (bytes >= 100_000_000) errors.push(`${dataset.path}: individual dataset must be below 100,000,000 bytes`);
  totalBytes += bytes;
  totalRecords += records;
  process.stdout.write(`${errors.some((error) => error.startsWith(`${dataset.path}:`)) ? 'FAIL' : 'PASS'} ${dataset.path}: ${records.toLocaleString('en-US')} records, ${bytes.toLocaleString('en-US')} bytes, SHA-256 ${digest}\n`);
}

if (manifest.summary?.datasetCount !== manifest.generatedDatasets.length) errors.push('manifest datasetCount mismatch');
if (manifest.summary?.records !== totalRecords) errors.push('manifest total record count mismatch');
if (manifest.summary?.bytes !== totalBytes) errors.push('manifest total byte count mismatch');
if (manifest.personalData !== false || manifest.syntheticEmailDomain !== 'example.test') errors.push('privacy metadata mismatch');
if (manifest.deterministic !== true || manifest.generator !== 'scripts/generate-benchmark-fixtures.mjs') errors.push('generator metadata mismatch');
if (schemas.size !== schemaPaths.length) errors.push('one or more JSON Schemas failed to load');

if (errors.length) {
  process.stderr.write(`\nFixture verification failed (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`\nAll benchmark fixtures verified: ${totalRecords.toLocaleString('en-US')} records, ${totalBytes.toLocaleString('en-US')} bytes; sequential IDs, field invariants and SHA-256 passed.\n`);
}
