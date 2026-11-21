# @forma-ui/codemods

Ferramenta CLI (`forma-codemod`) e biblioteca programática para migração automatizada de código entre versões SemVer de `@forma-ui`.

## Uso via CLI

```bash
# Listar todas as transformações disponíveis
npx forma-codemod --list

# Simular migração sem modificar arquivos em disco (--dry)
npx forma-codemod v0-to-v1-dialog-props ./src --dry

# Aplicar todas as migrações SemVer em um diretório recursivamente
npx forma-codemod all ./src
```

## Transformações Incluídas
- `v0-to-v1-dialog-props`: Migra `isOpen`/`onClose` para `open`/`onOpenChange`.
- `v0-to-v1-select-value`: Migra `selectedValue`/`onSelect` para `value`/`onValueChange`.
- `v0-to-v1-tabs-default`: Migra `initialTab`/`onTabChange` para `defaultValue`/`onValueChange`.
- `v0-to-v1-accordion-expanded`: Migra `expandedItems`/`onExpandedChange` para `value`/`onValueChange`.
- `v1-to-v2-direction-provider`: Migra `DirectionProvider` legado para `FormaProvider`.
