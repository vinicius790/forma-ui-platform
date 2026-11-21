/**
 * Native Node 24 TypeScript runtime verification suite for Forma UI 50.0.0.
 * Exercises ALL new v50 controllers, Web API primitives, Qwik resumable bindings, DevTools inspector,
 * all 6 domain engines v50, and platform/styling/QA modules directly from TypeScript source.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@forma-ui/core') {
      return { url: pathToFileURL(resolve(rootDir, 'packages/core/src/index.ts')).href, shortCircuit: true };
    }
    if (specifier.startsWith('@forma-ui/core/')) {
      const sub = specifier.slice('@forma-ui/core/'.length);
      return { url: pathToFileURL(resolve(rootDir, 'packages/core/src', `${sub}.ts`)).href, shortCircuit: true };
    }
    if (specifier === '@forma-ui/tokens') {
      return { url: pathToFileURL(resolve(rootDir, 'packages/tokens/src/index.ts')).href, shortCircuit: true };
    }
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

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

const load = (rel) => import(pathToFileURL(resolve(rootDir, rel)).href);

const core = await load('packages/core/src/index.ts');
const qwik = await load('packages/qwik/src/index.ts');
const devtools = await load('packages/devtools/src/index.ts');
const forms = await load('packages/forms/src/index.ts');
const grid = await load('packages/data-grid/src/index.ts');
const commands = await load('packages/commands/src/index.ts');
const dates = await load('packages/dates/src/index.ts');
const virt = await load('packages/virtualization/src/index.ts');
const collections = await load('packages/collections/src/index.ts');
const tokens = await load('packages/tokens/src/index.ts');
const themes = await load('packages/themes/src/index.ts');
const tailwind = await load('packages/tailwind/src/index.ts');
const motion = await load('packages/motion/src/index.ts');
const ssr = await load('packages/ssr/src/index.ts');
const floatingAnchor = await load('packages/floating-ui/src/safe-polygon-and-anchor.ts');
const testing = await load('packages/testing/src/index.ts');

await check('@forma-ui/core v50 controllers (TreeGrid, Menubar, Feed, Kanban, CommandBar, OtpInput, SignaturePad, QrCode, BottomSheet, NotificationCenter)', () => {
  const noop = () => {};
  const tg = core.createTreeGridController({ rows: [{ id: 'a', level: 1, hasChildren: true }, { id: 'b', level: 2 }], columnCount: 2 });
  tg.handleKeyDown({ key: 'ArrowRight', ctrlKey: false, preventDefault: noop });
  assert.equal(tg.isExpanded('a'), true);
  tg.destroy();

  const mb = core.createMenubarController({ items: [{ id: 'file' }, { id: 'edit' }], dir: 'rtl' });
  mb.openMenu('file');
  mb.getTriggerProps('file').onKeyDown({ key: 'ArrowLeft', preventDefault: noop });
  assert.equal(mb.activeMenu, 'edit');
  mb.destroy();

  const feed = core.createFeedController({ count: 3, setSize: 10 });
  feed.getArticleProps(0).onKeyDown({ key: 'PageDown', ctrlKey: false, preventDefault: noop });
  assert.equal(feed.focusedIndex, 1);
  feed.destroy();

  const kb = core.createKanbanController({
    columns: [
      { id: 'todo', title: 'To Do', cards: [{ id: 'c1', title: 'Card 1' }] },
      { id: 'done', title: 'Done', wipLimit: 2, cards: [] },
    ],
  });
  assert.equal(kb.moveCard('c1', 'done'), true);
  assert.equal(kb.columns[1].cards.length, 1);
  kb.destroy();

  const cb = core.createCommandBarController({
    items: [
      { id: 'a', label: 'A', width: 100, priority: 10 },
      { id: 'b', label: 'B', width: 100, priority: 1 },
    ],
    containerWidth: 160,
    overflowButtonWidth: 40,
    gap: 8,
  });
  assert.deepEqual(cb.visibleItems.map((i) => i.id), ['a']);
  assert.deepEqual(cb.overflowItems.map((i) => i.id), ['b']);
  cb.destroy();

  let completed = '';
  const otp = core.createOtpInputController({ length: 4, onComplete: (v) => { completed = v; } });
  otp.paste('98x76');
  assert.equal(completed, '9876');
  otp.destroy();

  const sig = core.createSignaturePadController();
  sig.beginStroke({ x: 0, y: 0 });
  sig.appendPoint({ x: 10, y: 12 });
  sig.appendPoint({ x: 24, y: 4 });
  sig.endStroke();
  assert.match(sig.toSvgPath(), /^M 0 0 Q/u);
  sig.undo();
  assert.equal(sig.isEmpty, true);
  sig.destroy();

  const qr = core.createQrCodeController({ value: 'https://forma-ui.dev/v50' });
  assert.equal(qr.getSvgProps().viewBox, '0 0 21 21');
  qr.destroy();

  const bs = core.createBottomSheetController({ defaultOpen: true, snapPoints: [0.3, 0.7, 0.95] });
  bs.resolveDragRelease(0.9, 0);
  assert.equal(bs.snapIndex, 2);
  bs.resolveDragRelease(0.4, 1.5);
  assert.equal(bs.open, false);
  bs.destroy();

  const nc = core.createNotificationCenterController();
  nc.push({ title: 'Release 50.0.0' });
  assert.equal(nc.unreadCount, 1);
  nc.markAllRead();
  assert.equal(nc.unreadCount, 0);
  nc.destroy();
});

await check('@forma-ui/core v50 primitives (FocusScope, Gesture, EyeDropper, Viewport, TelemetryBus)', () => {
  const scope = core.createFocusScope(null);
  scope.mount()();
  assert.equal(core.computePinchDistance({ x: 0, y: 0 }, { x: 6, y: 8 }), 10);
  const g = core.createGestureController();
  g.pointerDown({ x: 10, y: 10, time: 0 });
  assert.equal(g.pointerUp({ x: 10, y: 90, time: 80 }), 'down');
  g.destroy();
  assert.equal(typeof core.supportsEyeDropper(), 'boolean');
  const stopVv = core.observeVisualViewport(() => {});
  stopVv();
  const bus = core.createTelemetryBus(10);
  bus.emit({ id: 'dlg-1', controller: 'Dialog', action: 'open', severity: 'info' });
  assert.equal(bus.getHistory().length, 1);
});

await check('@forma-ui/qwik & @forma-ui/devtools (2 brand-new packages)', () => {
  const qPop = qwik.createQwikPopover({ defaultOpen: false });
  assert.equal(qPop.state.open, false);
  const live = qPop.resume();
  live.setOpen(true);
  assert.equal(qPop.state.open, true);
  qPop.dispose();

  const inspector = devtools.createDevtoolsInspector();
  const unregister = inspector.register({ id: 'sheet-1', name: 'BottomSheet', readState: () => ({ open: true }) });
  inspector.recordTransition('sheet-1', 'BottomSheet', 'snapTo', { index: 2 });
  const snap = inspector.snapshot();
  assert.equal(snap.controllers.length, 1);
  assert.equal(snap.eventCount, 2);
  unregister();
  inspector.destroy();
});

await check('@forma-ui/forms, data-grid, commands, dates, virtualization, collections v50 extensions', async () => {
  const form = forms.createFormController({
    initialValues: { qty: 2, price: 15, total: 0 },
    validate: forms.createJsonSchemaFormValidator({
      type: 'object',
      required: ['qty'],
      properties: { qty: { type: 'number', minimum: 1 } },
    }),
    onSubmit: () => {},
  });
  const computed = forms.createComputedFieldsEngine(form, [{ target: 'total', compute: (v) => v.qty * v.price }], { immediate: true });
  assert.equal(form.getSnapshot().values.total, 30);
  computed.destroy();
  form.destroy();

  const flat = grid.flattenTreeRows(
    [{ id: 'root', children: [{ id: 'child' }] }],
    (n) => n.children,
    ['root'],
    (n) => n.id,
  );
  assert.equal(flat.length, 2);
  const sel = grid.createCellRangeSelectionManager();
  sel.select(0, 0);
  sel.expand(1, 1);
  assert.equal(sel.isSelected(1, 1), true);
  assert.deepEqual(grid.parseTsvClipboard(grid.serializeSelectionToTsv([['a', 'b'], ['1', '2']])), [['a', 'b'], ['1', '2']]);

  let hit = false;
  const chords = commands.createChordSequenceTracker([{ id: 'inbox', sequence: ['g', 'i'], onMatch: () => { hit = true; } }]);
  chords.feed('g');
  chords.feed('i');
  assert.equal(hit, true);
  chords.destroy();

  const recur = dates.expandRecurrence({ start: '2026-01-01', freq: 'daily', interval: 2, count: 3 });
  assert.deepEqual(recur, ['2026-01-01', '2026-01-03', '2026-01-05']);
  assert.equal(dates.diffISODates('2026-01-11', '2026-01-01'), 10);

  const masonry = virt.createMasonryVirtualizer({ count: 50, lanes: 3, estimateSize: 100 });
  masonry.setViewport(0, 300);
  assert.ok(masonry.getVirtualItems().length > 0);
  masonry.destroy();

  const filteredTree = collections.filterTreePreservingAncestors(
    [{ id: 'root', children: [{ id: 'match' }, { id: 'skip' }] }],
    (n) => n.id === 'match',
  );
  assert.equal(filteredTree[0].children.length, 1);
});

await check('@forma-ui/tokens, themes, tailwind, motion, ssr, floating-ui, testing v50', () => {
  const oklch = tokens.hexToOklch('#1d4ed8');
  assert.ok(oklch.l > 0 && oklch.l < 1 && oklch.c > 0);
  assert.match(tokens.oklchToCss(oklch), /^oklch\(/u);
  const scale = tokens.generateTonalScale('#1d4ed8');
  assert.ok(scale[500].startsWith('oklch('));

  const custom = themes.createCustomTheme('ocean', { brandHex: '#0284c7', mode: 'dark' });
  assert.ok(custom.css.includes('[data-forma-theme="ocean"]'));
  assert.ok(themes.typedPropertiesCss().includes('@property --forma-color-'));

  assert.ok('forma-expanded' in tailwind.formaStateVariants);
  assert.equal(motion.computeStaggerDelay(3, 50, 200), 150);
  assert.match(motion.createScrollTimelineCss('--reveal'), /animation-timeline/u);

  const dsd = ssr.renderDeclarativeShadowDom('<slot></slot>', ':host{display:block}');
  assert.ok(dsd.includes('shadowrootmode="open"'));
  assert.ok(ssr.createHydrationScriptTag('forma-data', { ok: true }, 'abc').includes('nonce="abc"'));
  assert.equal(ssr.hashRenderTree('forma-v50'), ssr.hashRenderTree('forma-v50'));

  assert.equal(
    floatingAnchor.isPointInSafePolygon({ x: 5, y: 5 }, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]),
    true,
  );
  assert.equal(typeof testing.assertRtlArrowMirroring, 'function');
});

console.log(`\nALL ${passed} Forma UI 50.0.0 runtime verification suites passed!`);
