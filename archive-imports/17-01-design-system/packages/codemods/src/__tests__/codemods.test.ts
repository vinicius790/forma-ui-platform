import { describe, it, expect } from 'vitest';
import {
  runCodemod,
  runCodemodWithReport,
  runAllCodemods,
  listCodemods
} from '../index.js';

describe('@forma-ui/codemods — SemVer Automated Migrations', () => {
  it('lists all available SemVer migration transforms', () => {
    const list = listCodemods();
    expect(list.length).toBeGreaterThanOrEqual(5);
    expect(list.map((i) => i.name)).toContain('v0-to-v1-dialog-props');
  });

  it('migrates legacy v0 Dialog props to v1 open/onOpenChange with accurate change report', () => {
    const legacy = '<Dialog isOpen={open} onClose={setOpen} />';
    const report = runCodemodWithReport('v0-to-v1-dialog-props', legacy);
    expect(report.changed).toBe(true);
    expect(report.replacementsCount).toBe(1);
    expect(report.output).toBe('<Dialog open={open} onOpenChange={setOpen} />');
  });

  it('migrates legacy Select, Tabs, Accordion and DirectionProvider in batch via runAllCodemods', () => {
    const legacyCode = [
      'createSelectMachine({ selectedValue, onSelect });',
      'createTabsMachine({ initialTab: "a", onTabChange: fn });',
      'createAccordionMachine({ expandedItems: ["1"], onExpandedChange: fn });',
      '<DirectionProvider locale="ar-SA" />'
    ].join('\n');

    const batch = runAllCodemods(legacyCode);
    expect(batch.changed).toBe(true);
    expect(batch.replacementsCount).toBe(4);
    expect(batch.output).toContain('createSelectMachine({ value, onValueChange });');
    expect(batch.output).toContain('createTabsMachine({ defaultValue: "a", onValueChange: fn });');
    expect(batch.output).toContain('createAccordionMachine({ value: ["1"], onValueChange: fn });');
    expect(batch.output).toContain('<FormaProvider locale="ar-SA" />');
  });

  it('throws descriptive error when transform name does not exist', () => {
    expect(() => runCodemod('invalid-transform', 'const x = 1;')).toThrow(
      /Codemod desconhecido/
    );
  });
});
