import ts from 'typescript';

export type MigrationVersion = 'v0' | 'v1' | 'v2' | 'v10' | 'v50';
export type EcosystemSource = 'radix' | 'headlessui' | 'chakra' | 'ark';
export interface MigrationResult {
  code: string;
  changed: boolean;
  changes: string[];
  warnings: string[];
}

const migrations: Record<string, Record<string, string>> = {
  'v0->v1': {
    onChangeOpen: 'onOpenChange',
    defaultOpened: 'defaultOpen',
    isDisabled: 'disabled',
    closeOnEsc: 'closeOnEscape',
  },
  'v1->v2': {
    onOpenChangeLegacy: 'onOpenChange',
    onSelectedValueChange: 'onValueChange',
  },
  'v2->v10': {
    createDrawerState: 'createDrawerController',
    createPopoverState: 'createPopoverController',
    onStepChanged: 'onStepChange',
    onTagsChange: 'onValueChange',
  },
  'v10->v50': {
    createCommandPalette: 'createCommandBarController',
    createNotificationStore: 'createNotificationCenterController',
    createBottomSheetState: 'createBottomSheetController',
    createKanbanState: 'createKanbanController',
    onNotificationDismiss: 'onDismiss',
    onCardMoved: 'onMoveCard',
  },
};

function isRenameableIdentifier(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isJsxAttribute(parent) && parent.name === node) ||
    (ts.isMethodDeclaration(parent) && parent.name === node) ||
    (ts.isPropertyDeclaration(parent) && parent.name === node) ||
    (ts.isPropertySignature(parent) && parent.name === node) ||
    (ts.isCallExpression(parent) && parent.expression === node)
  );
}

export function transformSource(
  source: string,
  from: MigrationVersion,
  to: MigrationVersion,
  fileName = 'input.ts',
): MigrationResult {
  const diagnostics: string[] = [];
  let code = source;
  const versions: MigrationVersion[] = ['v0', 'v1', 'v2', 'v10', 'v50'];
  const start = versions.indexOf(from);
  const end = versions.indexOf(to);
  if (start < 0 || end < 0 || start > end) throw new Error(`Migração inválida: ${from} -> ${to}`);
  for (let index = start; index < end; index += 1) {
    const key = `${versions[index]}->${versions[index + 1]}`;
    const mapping = migrations[key];
    if (!mapping) continue;
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.Latest,
      true,
      fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => (root) => {
      const visit: ts.Visitor = (node) => {
        if (ts.isIdentifier(node) && isRenameableIdentifier(node) && mapping[node.text]) {
          const replacement = mapping[node.text]!;
          diagnostics.push(`${node.text} → ${replacement}`);
          return context.factory.createIdentifier(replacement);
        }
        return ts.visitEachChild(node, visit, context);
      };
      return ts.visitNode(root, visit) as ts.SourceFile;
    };
    const beforeDiagnostics = diagnostics.length;
    const transformed = ts.transform(sourceFile, [transformer]);
    if (diagnostics.length > beforeDiagnostics) {
      code = printer.printFile(transformed.transformed[0] as ts.SourceFile);
    }
    transformed.dispose();
  }
  const changed = code !== source;
  const unique = [...new Set(diagnostics)];
  const warnings = changed
    ? []
    : ['Nenhuma transformação conhecida foi aplicada. Revise manualmente a API e a versão de origem.'];
  return { code, changed, changes: unique, warnings };
}

const ecosystemImportRewrites: Record<EcosystemSource, ReadonlyArray<[RegExp, string, string]>> = {
  radix: [
    [
      /@radix-ui\/react-(dialog|popover|tabs|menu|accordion|checkbox|switch|slider|tooltip|collapsible|hover-card|context-menu|dropdown-menu|menubar|navigation-menu|select|radio-group|toggle-group|toolbar|scroll-area|separator|progress|avatar|toast)/gu,
      '@forma-ui/react',
      'Radix primitive → @forma-ui/react',
    ],
  ],
  headlessui: [
    [/@headlessui\/react/gu, '@forma-ui/react', '@headlessui/react → @forma-ui/react'],
    [/@headlessui\/vue/gu, '@forma-ui/vue', '@headlessui/vue → @forma-ui/vue'],
  ],
  chakra: [
    [/@chakra-ui\/react/gu, '@forma-ui/react', '@chakra-ui/react → @forma-ui/react'],
    [/@chakra-ui\/icons/gu, '@forma-ui/core', '@chakra-ui/icons → @forma-ui/core'],
  ],
  ark: [
    [/@ark-ui\/react(?:\/[a-z0-9-]+)?/gu, '@forma-ui/react', '@ark-ui/react → @forma-ui/react'],
    [/@ark-ui\/vue(?:\/[a-z0-9-]+)?/gu, '@forma-ui/vue', '@ark-ui/vue → @forma-ui/vue'],
    [/@ark-ui\/solid(?:\/[a-z0-9-]+)?/gu, '@forma-ui/solid', '@ark-ui/solid → @forma-ui/solid'],
    [/@ark-ui\/svelte(?:\/[a-z0-9-]+)?/gu, '@forma-ui/svelte', '@ark-ui/svelte → @forma-ui/svelte'],
  ],
};

/** Rewrites module specifiers from Radix UI, Headless UI, Chakra UI or Ark UI to Forma UI adapters as a migration starting point. */
export function migrateEcosystemImports(source: string, from: EcosystemSource): MigrationResult {
  let code = source;
  const changes: string[] = [];
  for (const [pattern, replacement, label] of ecosystemImportRewrites[from]) {
    if (pattern.test(code)) {
      code = code.replace(pattern, replacement);
      changes.push(label);
    }
  }
  return {
    code,
    changed: code !== source,
    changes,
    warnings: code === source ? [`Nenhum import de ${from} encontrado.`] : ['Revise os hooks/prop getters após migrar os imports.'],
  };
}

export function supportedMigrations(): readonly string[] {
  return Object.keys(migrations);
}
