/**
 * Native Node 24 TypeScript runtime verification suite for Forma UI 100.0.0.
 * Exercises all 8 centennial controllers, 4 frontier primitives, @forma-ui/ai-ui, @forma-ui/crdt, and @forma-ui/qwik v100.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@forma-ui/core') return { url: pathToFileURL(resolve(rootDir, 'packages/core/src/index.ts')).href, shortCircuit: true };
    if (specifier.startsWith('@forma-ui/core/')) return { url: pathToFileURL(resolve(rootDir, 'packages/core/src', `${specifier.slice(15)}.ts`)).href, shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const base = dirname(fileURLToPath(context.parentURL));
      const directTs = resolve(base, `${specifier}.ts`);
      if (existsSync(directTs)) return { url: pathToFileURL(directTs).href, shortCircuit: true };
      const indexTs = resolve(base, specifier, 'index.ts');
      if (existsSync(indexTs)) return { url: pathToFileURL(indexTs).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const load = (rel) => import(pathToFileURL(resolve(rootDir, rel)).href);
const core = await load('packages/core/src/index.ts');
const aiUi = await load('packages/ai-ui/src/index.ts');
const crdt = await load('packages/crdt/src/index.ts');
const qwik = await load('packages/qwik/src/index.ts');
const i18n = await load('packages/i18n/src/index.ts');
const charts = await load('packages/charts/src/index.ts');

let passed = 0;
async function check(name, fn) { await fn(); passed += 1; console.log(`✓ ${name}`); }

await check('@forma-ui/core v100 controllers (Dock, Timeline, DiffViewer, Mention, SpatialCanvas, AudioPlayer, CodeGutter, WizardDialog)', async () => {
  const noop = () => {};
  const dock = core.createDockController({ panes: [{ id: 'p1', tabs: [{ id: 't1', title: 'Editor' }], activeTabId: 't1' }] });
  dock.splitPane('p2', { id: 't2', title: 'Preview' });
  assert.equal(dock.panes.length, 2);
  dock.destroy();

  const tl = core.createTimelineController({ items: [], minTime: 0, maxTime: 100, step: 5 });
  tl.getPlayheadProps().onKeyDown({ key: 'ArrowRight', shiftKey: true, preventDefault: noop });
  assert.equal(tl.playhead, 50);
  tl.destroy();

  const diff = core.createDiffViewerController({ original: 'line1\nline2', modified: 'line1\nline2-edit\nline3' });
  assert.deepEqual(diff.stats, { added: 2, removed: 1, unchanged: 1 });
  diff.destroy();

  const mention = core.createMentionController({ candidates: [{ id: '1', label: 'forma' }] });
  mention.updateText('Use @fo', 7);
  assert.equal(mention.selectCandidate(0)?.text, 'Use @forma ');
  mention.destroy();

  const sc = core.createSpatialCanvasController();
  sc.zoomAt(2, 50, 50);
  assert.equal(sc.transform.zoom, 2);
  sc.destroy();

  const ap = core.createAudioPlayerController({ duration: 120 });
  ap.getScrubberProps().onKeyDown({ key: '5', preventDefault: noop });
  assert.equal(ap.state.currentTime, 60);
  ap.destroy();

  const cg = core.createCodeGutterController({ lineCount: 5, foldRanges: [{ startLine: 2, endLine: 4 }] });
  cg.toggleFold(2);
  assert.deepEqual(cg.getVisibleLines(), [1, 2, 5]);
  cg.destroy();

  const wd = core.createWizardDialogController({ dirty: true, onConfirm: async () => {} });
  wd.show();
  assert.equal(wd.requestClose(), false);
  assert.equal(await wd.confirm(), true);
  wd.destroy();
});

await check('@forma-ui/core v100 primitives (SpatialNav, Scheduler, WebShare, UrlStateCodec)', async () => {
  const best = core.findSpatialCandidate(
    { id: '1', x: 0, y: 0, width: 40, height: 40 },
    [{ id: '2', x: 100, y: 0, width: 40, height: 40 }, { id: '3', x: 100, y: 120, width: 40, height: 40 }],
    'right',
  );
  assert.equal(best?.id, '2');
  assert.equal(await core.runChunkedWork([1, 2, 3, 4], () => {}, 2), 4);
  assert.equal(typeof core.supportsWebShare(), 'boolean');
  const codec = core.createUrlStateCodec({ page: 1, filter: 'all', compact: false });
  assert.deepEqual(codec.decode(codec.encode({ page: 4, compact: true })), { page: 4, filter: 'all', compact: true });
});

await check('@forma-ui/ai-ui (StreamingMessage, ToolApproval, Citation)', () => {
  const stream = aiUi.createStreamingMessageController();
  stream.start();
  stream.append('Hello ');
  stream.append('world');
  stream.complete();
  assert.equal(stream.snapshot.content, 'Hello world');
  assert.equal(stream.snapshot.status, 'complete');
  stream.destroy();

  const approvals = aiUi.createToolApprovalController();
  approvals.enqueue({ id: 't1', toolName: 'deploy', args: { env: 'prod' }, riskLevel: 'high' });
  assert.equal(approvals.pendingCount, 1);
  assert.equal(approvals.approve('t1'), true);
  assert.equal(approvals.pendingCount, 0);
  approvals.destroy();

  const cites = aiUi.createCitationController([{ id: 's1', title: 'WCAG 2.2' }]);
  cites.focusSource('s1');
  assert.equal(cites.getSourceProps('s1')['data-highlighted'], 'true');
  cites.destroy();
});

await check('@forma-ui/crdt (LwwRegister, LwwMap, PresenceController) & @forma-ui/qwik v100', () => {
  const rA = crdt.createLwwRegister('peer-a', 'init');
  const rB = crdt.createLwwRegister('peer-b', 'init');
  const envA = rA.set('from-a');
  const envB = rB.set('from-b');
  rA.merge(envB);
  rB.merge(envA);
  assert.equal(rA.value, rB.value);

  const mA = crdt.createLwwMap('a');
  const mB = crdt.createLwwMap('b');
  mA.set('title', 'Doc A');
  mB.set('status', 'ready');
  mA.mergeState(mB.exportState());
  mB.mergeState(mA.exportState());
  assert.deepEqual(mA.toRecord(), mB.toRecord());

  const presence = crdt.createPresenceController({ ttlMs: 5000 });
  presence.update('u1', { x: 10, y: 20 }, 1000);
  presence.update('u2', { x: 30, y: 40 }, 4000);
  assert.equal(presence.prune(7000), 1);
  assert.equal(presence.getActivePeers(7000).length, 1);
  presence.destroy();

  const qDock = qwik.createQwikDock({ panes: [{ id: 'main', tabs: [], activeTabId: null }] });
  qDock.resume().splitPane('side');
  assert.equal(qDock.state.activePaneId, 'side');
  qDock.dispose();
});

await check('@forma-ui/core v100.0 enterprise suite (CalendarScheduler, Gantt CPM, SpreadsheetFormula, BreadcrumbOverflow, MacroRecorder, ShortcutRegistry)', async () => {
  const sched = core.createCalendarSchedulerController({
    events: [
      { id: 'e1', title: 'Standup', startMinute: 540, endMinute: 600 },
      { id: 'e2', title: 'Design', startMinute: 570, endMinute: 630 },
    ],
  });
  const layout = sched.getLayout();
  assert.equal(layout[0].laneCount, 2);
  sched.destroy();

  const gantt = core.createGanttController([
    { id: 'A', title: 'Spec', duration: 3 },
    { id: 'B', title: 'Core', duration: 5, dependencies: ['A'] },
    { id: 'C', title: 'Docs', duration: 2, dependencies: ['A'] },
    { id: 'D', title: 'Ship', duration: 1, dependencies: ['B', 'C'] },
  ]);
  const cpm = gantt.getSchedule();
  assert.equal(cpm.totalDuration, 9);
  assert.equal(cpm.tasks.find((t) => t.id === 'B').critical, true);
  assert.equal(cpm.tasks.find((t) => t.id === 'C').critical, false);

  const sheet = core.createSpreadsheetFormulaEngine();
  sheet.setCell('A1', 10);
  sheet.setCell('A2', 20);
  sheet.setCell('A3', 30);
  sheet.setCell('B1', '=SUM(A1:A3)');
  sheet.setCell('B2', '=AVG(A1:A3)');
  assert.equal(sheet.evaluate('B1'), 60);
  assert.equal(sheet.evaluate('B2'), 20);
  sheet.destroy();

  const bc = core.partitionBreadcrumbs(
    [{ id: '1', label: 'Home' }, { id: '2', label: 'Org' }, { id: '3', label: 'Team' }, { id: '4', label: 'Repo' }, { id: '5', label: 'File' }],
    3,
  );
  assert.equal(bc.hasOverflow, true);
  assert.equal(bc.collapsed.length, 2);

  const macro = core.createMacroRecorder();
  macro.start(100);
  macro.record('Dialog', 'open', undefined, 150);
  macro.record('Dialog', 'close', undefined, 200);
  macro.stop();
  const replayed = [];
  await macro.replay((s) => { replayed.push(s.action); });
  assert.deepEqual(replayed, ['open', 'close']);

  const reg = core.createShortcutRegistry();
  reg.register({ id: 'a', combo: 'mod+k', label: 'Palette' });
  reg.register({ id: 'b', combo: 'mod+k', label: 'Search' });
  assert.equal(reg.findConflicts().length, 1);
  assert.equal(core.formatShortcutLabel('mod+shift+k', 'mac'), '⌘⇧K');
  reg.destroy();

  const tt = core.createTreeTableController({
    columns: [{ id: 'name', header: 'Name' }],
    rows: [{ id: 'r1', values: { name: 'Root' }, children: [{ id: 'c1', values: { name: 'Child' } }] }],
  });
  assert.equal(tt.getVisibleRows().length, 1);
  tt.toggleRow('r1');
  assert.equal(tt.getVisibleRows().length, 2);

  const fb = core.createFilterBuilderController();
  fb.addCondition({ id: '1', field: 'score', operator: 'gt', value: 80 });
  assert.equal(fb.matches({ score: 95 }), true);

  const chk = core.createOnboardingChecklistController([{ id: 's1', title: 'Install' }, { id: 's2', title: 'Build', requires: ['s1'] }]);
  assert.equal(chk.completeStep('s2'), false);
  assert.equal(chk.completeStep('s1'), true);
  assert.equal(chk.completeStep('s2'), true);
  assert.equal(chk.progressPercent, 100);

  const sb = core.createSplitButtonController();
  sb.getMenuTriggerProps().onKeyDown({ key: 'ArrowDown', preventDefault: () => {} });
  assert.equal(sb.open, true);

  const kv = core.createAsyncKvStore();
  await kv.set('k', 123);
  assert.equal(await kv.get('k'), 123);

  const cat = i18n.createLocaleCatalog('he-IL', { 'he-IL': { items: '{count, plural, =0 {No items} other {# items}}' } });
  assert.equal(cat.direction, 'rtl');
  assert.equal(cat.t('items', { count: 5 }), '5 items');

  const chart = charts.createChartAccessibilityController([{ id: 's1', name: 'Latency', points: [{ label: 'P50', value: 12 }, { label: 'P99', value: 48 }] }]);
  chart.handleKeyDown({ key: 'ArrowRight', preventDefault: () => {} });
  assert.equal(chart.currentAnnouncement, 'Latency, P99: 48');
  assert.ok(charts.valueToFrequencyHz(50, 0, 100) > 400);
});

console.log(`\nALL ${passed} Forma UI 100.0.0 runtime verification suites passed!`);
