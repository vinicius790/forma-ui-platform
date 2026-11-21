import { describe, expect, it } from 'vitest';
import { migrateEcosystemImports, supportedMigrations, transformSource } from '../index';

describe('Forma UI codemods', () => {
  it('renames known v0 API properties without changing unrelated text', () => { const result = transformSource("const config = { onChangeOpen: onChangeOpen, isDisabled: true, label: 'onChangeOpen' };", 'v0', 'v1'); expect(result.changed).toBe(true); expect(result.code).toContain('onOpenChange'); expect(result.code).toContain('disabled'); expect(result.code).toContain("'onChangeOpen'"); });
  it('migrates v10 identifiers to v50 controllers', () => {
    const result = transformSource('const sheet = createBottomSheetState({ onNotificationDismiss: fn });', 'v10', 'v50');
    expect(result.changed).toBe(true);
    expect(result.code).toContain('createBottomSheetController');
    expect(result.code).toContain('onDismiss');
  });
  it('leaves code untouched when no migration is recognized', () => { const source = 'const value = 1;'; const result = transformSource(source, 'v0', 'v1'); expect(result.changed).toBe(false); expect(result.warnings).toHaveLength(1); });
  it('exposes only supported paths', () => { expect(supportedMigrations()).toEqual(['v0->v1', 'v1->v2', 'v2->v10', 'v10->v50']); });
  it('rewrites Chakra and Ark ecosystem imports', () => {
    expect(migrateEcosystemImports("import { Button } from '@chakra-ui/react';", 'chakra').code).toContain("'@forma-ui/react'");
    expect(migrateEcosystemImports("import { Dialog } from '@ark-ui/vue/dialog';", 'ark').code).toContain("'@forma-ui/vue'");
  });
});
