export interface CodemodTransform {
  name: string;
  fromVersion: string;
  toVersion: string;
  description: string;
  transform: (source: string) => string;
}

export interface CodemodExecutionReport {
  transformName: string;
  changed: boolean;
  output: string;
  replacementsCount: number;
}

export const codemodTransforms: CodemodTransform[] = [
  {
    name: 'v0-to-v1-dialog-props',
    fromVersion: '0.x',
    toVersion: '1.0.0',
    description: 'Migra isOpen/onClose para open/onOpenChange em createDialogMachine e <Dialog>.',
    transform: (source) =>
      source
        .replace(/\bisOpen\s*:/g, 'open:')
        .replace(/\bisOpen=\{/g, 'open={')
        .replace(/\bonClose\s*:/g, 'onOpenChange:')
        .replace(/\bonClose=\{/g, 'onOpenChange={')
  },
  {
    name: 'v0-to-v1-select-value',
    fromVersion: '0.x',
    toVersion: '1.0.0',
    description: 'Migra selectedValue/onSelect para value/onValueChange em Select.',
    transform: (source) =>
      source
        .replace(/\bselectedValue\b/g, 'value')
        .replace(/\bonSelect\b/g, 'onValueChange')
  },
  {
    name: 'v0-to-v1-tabs-default',
    fromVersion: '0.x',
    toVersion: '1.0.0',
    description: 'Migra initialTab/onTabChange para defaultValue/onValueChange em Tabs.',
    transform: (source) =>
      source
        .replace(/\binitialTab\b/g, 'defaultValue')
        .replace(/\bonTabChange\b/g, 'onValueChange')
  },
  {
    name: 'v0-to-v1-accordion-expanded',
    fromVersion: '0.x',
    toVersion: '1.0.0',
    description: 'Migra expandedItems/onExpandedChange para value/onValueChange em Accordion.',
    transform: (source) =>
      source
        .replace(/\bexpandedItems\b/g, 'value')
        .replace(/\bonExpandedChange\b/g, 'onValueChange')
  },
  {
    name: 'v1-to-v2-direction-provider',
    fromVersion: '1.x',
    toVersion: '2.0.0',
    description: 'Consolida DirectionProvider legado em FormaProvider.',
    transform: (source) => source.replace(/\bDirectionProvider\b/g, 'FormaProvider')
  }
];

export function listCodemods(): ReadonlyArray<Omit<CodemodTransform, 'transform'>> {
  return codemodTransforms.map(({ name, fromVersion, toVersion, description }) => ({
    name,
    fromVersion,
    toVersion,
    description
  }));
}

export function runCodemod(transformName: string, sourceCode: string): string {
  const found = codemodTransforms.find((t) => t.name === transformName);
  if (!found) {
    throw new Error(
      `Codemod desconhecido: "${transformName}". Disponíveis: ${codemodTransforms
        .map((t) => t.name)
        .join(', ')}`
    );
  }
  return found.transform(sourceCode);
}

export function runCodemodWithReport(
  transformName: string,
  sourceCode: string
): CodemodExecutionReport {
  const output = runCodemod(transformName, sourceCode);
  const sourceLines = sourceCode.split('\n');
  const outputLines = output.split('\n');
  let replacementsCount = 0;
  for (let i = 0; i < Math.max(sourceLines.length, outputLines.length); i++) {
    if (sourceLines[i] !== outputLines[i]) replacementsCount += 1;
  }
  return {
    transformName,
    changed: output !== sourceCode,
    output,
    replacementsCount
  };
}

export function runAllCodemods(sourceCode: string): CodemodExecutionReport {
  let current = sourceCode;
  let totalReplacements = 0;
  for (const mod of codemodTransforms) {
    const rep = runCodemodWithReport(mod.name, current);
    current = rep.output;
    totalReplacements += rep.replacementsCount;
  }
  return {
    transformName: 'all',
    changed: current !== sourceCode,
    output: current,
    replacementsCount: totalReplacements
  };
}
