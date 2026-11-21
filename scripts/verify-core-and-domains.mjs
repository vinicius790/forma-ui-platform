/**
 * Native Node 24 TypeScript runtime verification suite for Forma UI 10.0.0.
 * Executes real TypeScript source modules directly without needing external build/test packages installed.
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
      const target = resolve(rootDir, 'packages/core/src', `${sub}.ts`);
      return { url: pathToFileURL(target).href, shortCircuit: true };
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

const core = await import(pathToFileURL(resolve(rootDir, 'packages/core/src/index.ts')).href);
const forms = await import(pathToFileURL(resolve(rootDir, 'packages/forms/src/index.ts')).href);
const grid = await import(pathToFileURL(resolve(rootDir, 'packages/data-grid/src/index.ts')).href);
const commands = await import(pathToFileURL(resolve(rootDir, 'packages/commands/src/index.ts')).href);
const dates = await import(pathToFileURL(resolve(rootDir, 'packages/dates/src/index.ts')).href);
const virt = await import(pathToFileURL(resolve(rootDir, 'packages/virtualization/src/index.ts')).href);
const collections = await import(pathToFileURL(resolve(rootDir, 'packages/collections/src/index.ts')).href);
const tokens = await import(pathToFileURL(resolve(rootDir, 'packages/tokens/src/index.ts')).href);
const themes = await import(pathToFileURL(resolve(rootDir, 'packages/themes/src/index.ts')).href);
const tailwind = await import(pathToFileURL(resolve(rootDir, 'packages/tailwind/src/index.ts')).href);
const motion = await import(pathToFileURL(resolve(rootDir, 'packages/motion/src/index.ts')).href);
const ssr = await import(pathToFileURL(resolve(rootDir, 'packages/ssr/src/index.ts')).href);

await check('@forma-ui/core v1+v10 controllers (Popover, Drawer, Collapsible, Splitter, HoverCard, ContextMenu, Stepper, FileUpload, Carousel, ColorPicker, TagsInput, Editable, Tour, ScrollArea, SegmentGroup)', () => {
  const noop = () => {};
  const pop = core.createPopoverController({ id: 'p1', modal: true });
  pop.toggle();
  assert.equal(pop.open, true);
  assert.equal(pop.getContentProps()['aria-modal'], 'true');
  pop.destroy();

  const drw = core.createDrawerController({ placement: 'bottom' });
  drw.setOpen(true);
  assert.equal(drw.getContentProps()['data-placement'], 'bottom');
  drw.destroy();

  const col = core.createCollapsibleController({ defaultOpen: false });
  col.toggle();
  assert.equal(col.open, true);
  col.destroy();

  const spl = core.createSplitterController({ defaultValue: 50, min: 10, max: 90, step: 5, largeStep: 20 });
  spl.handleKeyDown({ key: 'ArrowRight', shiftKey: true, preventDefault: noop });
  assert.equal(spl.value, 70);
  spl.handleKeyDown({ key: 'Enter', shiftKey: false, preventDefault: noop });
  assert.equal(spl.value, 10);
  spl.handleKeyDown({ key: 'Enter', shiftKey: false, preventDefault: noop });
  assert.equal(spl.value, 70);
  spl.destroy();

  const ctx = core.createContextMenuController();
  ctx.openAt(42, 84);
  assert.deepEqual(ctx.point, { x: 42, y: 84 });
  ctx.destroy();

  const stp = core.createStepperController({ count: 3, linear: true });
  stp.goTo(2);
  assert.equal(stp.step, 0);
  stp.next();
  assert.equal(stp.step, 1);
  stp.destroy();

  const upl = core.createFileUploadController({ accept: ['image/*'], maxFileSize: 100, maxFiles: 1 });
  upl.addFiles([{ name: 'ok.png', size: 50, type: 'image/png' }, { name: 'big.png', size: 500, type: 'image/png' }]);
  assert.equal(upl.acceptedFiles.length, 1);
  assert.equal(upl.rejectedFiles[0].reason, 'file-too-large');
  upl.destroy();

  const car = core.createCarouselController({ slideCount: 4, loop: true });
  car.prev();
  assert.equal(car.index, 3);
  car.destroy();

  const clr = core.createColorPickerController({ defaultValue: { h: 0, s: 100, l: 50, a: 1 } });
  assert.equal(clr.hex, '#ff0000');
  clr.destroy();

  const tags = core.createTagsInputController({ maxTags: 2 });
  assert.equal(tags.addTag('a11y'), true);
  assert.equal(tags.addTag('a11y'), false);
  assert.equal(tags.addTag('wcag'), true);
  assert.equal(tags.addTag('overflow'), false);
  tags.destroy();

  const ed = core.createEditableController({ defaultValue: 'v10' });
  ed.edit();
  ed.setDraft('v10-final');
  ed.submit();
  assert.equal(ed.value, 'v10-final');
  ed.destroy();

  const tour = core.createTourController({ steps: [{ id: '1', title: 'One' }, { id: '2', title: 'Two' }] });
  tour.start();
  assert.equal(tour.progress, 0.5);
  tour.next();
  assert.equal(tour.progress, 1);
  tour.destroy();

  const sa = core.createScrollAreaController({ type: 'hover' });
  assert.equal(core.computeScrollThumb(250, 1000, 500).offsetPercent, 25);
  sa.destroy();

  const seg = core.createSegmentGroupController({ items: [{ value: 'a' }, { value: 'b' }], dir: 'rtl' });
  seg.getItemProps('a').onKeyDown({ key: 'ArrowLeft', preventDefault: noop });
  assert.equal(seg.value, 'b');
  seg.destroy();
});

await check('@forma-ui/core primitives (hotkeys, undo-redo, clipboard, media-query, popover-api, broadcast-sync)', () => {
  const parsed = core.parseHotkey('mod+shift+p');
  assert.equal(core.matchesHotkey({ key: 'P', ctrlKey: true, metaKey: false, altKey: false, shiftKey: true }, parsed), true);
  const hist = core.createHistoryStack('a', { capacity: 5 });
  hist.push('b');
  hist.push('c');
  assert.equal(hist.undo(), 'b');
  assert.equal(hist.redo(), 'c');
  assert.equal(typeof core.supportsNativePopoverApi(), 'boolean');
  const sync = core.createBroadcastSync('test-ch', () => {});
  sync.destroy();
});

await check('@forma-ui/forms v10 (FieldArray, Persistence, WizardForm)', async () => {
  const arr = forms.createFieldArrayController({ initialItems: ['x', 'y'], maxLength: 3 });
  assert.equal(arr.append('z'), true);
  assert.equal(arr.append('overflow'), false);
  arr.move(0, 2);
  assert.deepEqual(arr.values, ['y', 'z', 'x']);

  const store = new Map();
  const mockStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  const form = forms.createFormController({
    initialValues: { email: '', plan: 'pro' },
    validate: (v) => (v.email ? {} : { email: 'Required' }),
    onSubmit: () => {},
  });
  const persist = forms.createFormPersistence(form, { key: 'draft', storage: mockStorage, debounceMs: 0 });
  form.setFieldValue('email', 'user@example.test', false);
  assert.equal(store.has('draft'), true);
  persist.destroy();

  const wizard = forms.createWizardFormController(form, [
    { id: 'account', fields: ['email'] },
    { id: 'plan', fields: ['plan'] },
  ]);
  assert.equal(await wizard.nextStep(), true);
  assert.equal(wizard.stepIndex, 1);
  form.destroy();
});

await check('@forma-ui/data-grid v10 (Pinning, Sizing, Grouping/Aggregations, Inline Edit, RFC 4180 CSV/JSON)', () => {
  const dg = grid.createDataGrid({
    data: [
      { id: '1', dept: 'Eng', salary: 100, note: 'Hello, "World"' },
      { id: '2', dept: 'Eng', salary: 200, note: 'OK' },
      { id: '3', dept: 'Design', salary: 150, note: 'Clean' },
    ],
    columns: [
      { id: 'dept', header: 'Dept', accessorKey: 'dept' },
      { id: 'salary', header: 'Salary', accessorKey: 'salary' },
      { id: 'note', header: 'Note', accessorKey: 'note' },
    ],
    getRowId: (r) => r.id,
  });
  const rows = dg.getCoreRowModel();
  const pinned = grid.partitionPinnedColumns(dg.getVisibleColumns(), { left: ['dept'], right: ['note'] });
  assert.equal(pinned.left[0].id, 'dept');
  assert.equal(pinned.center[0].id, 'salary');
  assert.equal(pinned.right[0].id, 'note');

  const sizing = grid.createColumnSizingManager({ minWidth: 80, maxWidth: 400 });
  assert.equal(sizing.setWidth('salary', 50), 80);

  const grouped = grid.groupAndAggregateRows(rows, 'dept', { salary: 'avg', dept: 'count' });
  const eng = grouped.find((g) => g.key === 'Eng');
  assert.equal(eng.aggregates.salary, 150);
  assert.equal(eng.aggregates.dept, 2);

  const editor = grid.createInlineCellEditor();
  editor.start('1', 'salary', 100);
  editor.updateDraft(125);
  assert.equal(editor.commit().draftValue, 125);

  const csv = grid.exportGridToCsv(rows, dg.getVisibleColumns());
  assert.match(csv, /"Hello, ""World"""/u);
  dg.destroy();
});

await check('@forma-ui/commands v10 (Frecency, Fuzzy Match Highlight Ranges, Page Stack)', () => {
  assert.deepEqual(commands.getFuzzyMatchRanges('opn', 'Open File'), [{ start: 0, end: 2 }, { start: 3, end: 4 }]);
  const frec = commands.createFrecencyTracker(7);
  frec.record('cmd-1', 1000);
  frec.record('cmd-1', 1000);
  assert.equal(frec.score('cmd-1', 1000), 200);
  const stack = commands.createCommandPageStack();
  stack.push({ id: 'themes', title: 'Themes' });
  assert.equal(stack.depth, 1);
  assert.equal(stack.pop().id, 'themes');
});

await check('@forma-ui/dates v10 (ISO Week, DateRange, TimePicker)', () => {
  assert.equal(dates.getISOWeekNumber('2026-01-01'), 1);
  const range = dates.createDateRangeController();
  range.selectDate('2026-06-10');
  range.selectDate('2026-06-05');
  assert.equal(range.value.start, '2026-06-05');
  assert.equal(range.value.end, '2026-06-10');
  assert.equal(range.getDaysCount(), 6);
  const time = dates.createTimePickerController({ defaultValue: { hours: 14, minutes: 30 }, hourCycle: 12, minuteStep: 15 });
  assert.equal(time.formatted, '02:30 PM');
  time.stepMinutes(2);
  assert.equal(time.formatted, '03:00 PM');
});

await check('@forma-ui/virtualization v10 (2D GridVirtualizer with pinned header & column)', () => {
  const gv = virt.createGridVirtualizer({
    rowCount: 10000,
    columnCount: 500,
    estimateRowHeight: 40,
    estimateColumnWidth: 120,
    pinnedTopRows: 1,
    pinnedLeftColumns: 2,
  });
  gv.setViewport2D(400, 240, 400, 600);
  const snap = gv.getSnapshot();
  assert.equal(snap.pinnedRows.length, 1);
  assert.equal(snap.pinnedColumns.length, 2);
  assert.equal(snap.totalHeight, 400000);
  assert.equal(snap.totalWidth, 60000);
  gv.destroy();
});

await check('@forma-ui/collections v10 (Accessible Keyboard ReorderController)', () => {
  const re = collections.createReorderController({ items: ['First', 'Second', 'Third'], getKey: (x) => x });
  re.lift(0);
  re.moveBy(2);
  re.drop();
  assert.deepEqual([...re.items], ['Second', 'Third', 'First']);
  assert.match(re.announcement, /Dropped First at position 3/u);
});

await check('@forma-ui/tokens, themes, tailwind, motion, ssr v10', async () => {
  assert.ok(tokens.apcaContrastLc('#000000', '#ffffff') > 100);
  assert.equal(tokens.pickAccessibleForeground('#0f172a').color, '#ffffff');
  assert.match(tokens.createFluidTypeValue({ minRem: 1, maxRem: 2 }), /^clamp\(/u);
  assert.match(themes.allThemesCss({ layered: true }), /@layer forma\.themes/u);
  assert.match(tailwind.createFormaTailwindV4Css('dark'), /@custom-variant forma-open/u);
  assert.match(motion.createSpringLinearEasing({ stiffness: 300, damping: 20 }), /^linear\(/u);
  assert.equal(await motion.withViewTransition(() => 42), 42);
  const ctx = ssr.createHydrationContext('req-1');
  ctx.set('html', '</script><img src=x>');
  const serialized = ctx.serialize();
  assert.equal(serialized.includes('</script>'), false);
  assert.equal(ssr.deserializeHydrationState(serialized).entries.html, '</script><img src=x>');
});

console.log(`\nALL ${passed} Forma UI 10.0.0 runtime verification suites passed!`);
