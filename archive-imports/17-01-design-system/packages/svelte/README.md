# @forma-ui/svelte

Stores reativas compatíveis com o contrato nativo `$store` do Svelte 4 e Svelte 5, acompanhadas de actions DOM (`use:focusTrapAction` e `use:portalAction`) construídas sobre `@forma-ui/core`.

## Instalação

```bash
pnpm add @forma-ui/svelte @forma-ui/core
```

## Stores e Actions Exportadas
- **Actions DOM:**
  - `focusTrapAction(node, enabled)`: Ativa e atualiza armadilha de foco diretamente via diretiva `use:focusTrapAction`.
  - `portalAction(node, target)`: Teleporta o nó DOM para um container de portal mantendo limpeza automática no `destroy()`.
- **Store Factories (`{ machine, state }` compatível com `$state`):**
  - `createDialogStore(options)`
  - `createMenuStore(options)`
  - `createTabsStore(options)`
  - `createTooltipStore(options)`
  - `createSelectStore(options)`
  - `createSvelteToastStore(options)`
  - `createAccordionStore(options)`
  - `createSvelteI18nStore(locale)`
