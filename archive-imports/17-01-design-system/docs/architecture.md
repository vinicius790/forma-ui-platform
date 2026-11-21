# Arquitetura do Sistema — @forma-ui

## 1. Visão Geral e Filosofia de Design
O `@forma-ui` foi projetado sob o princípio de **Separação Estrita de Responsabilidades em 5 Camadas**, garantindo que toda a complexidade de acessibilidade WAI-ARIA 1.2, gerenciamento de foco, navegação por teclado, posicionamento flutuante e internacionalização (i18n/RTL) seja resolvida na camada `@forma-ui/core` sem impor nenhuma regra de CSS ao consumidor.

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Camada 1: @forma-ui/tokens                                                │
│ Escalas primitivas, tokens semânticos, CSS Vars (--forma-*), W3C JSON,    │
│ Calculadora Matemática de Luminância e Contraste WCAG 2.1 (AA / AAA).     │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Camada 2: @forma-ui/core (Zero CSS, Zero Framework Lock-in)               │
│ • 13 Primitivas: FocusTrap, ScrollLock, AriaHideOutside, RovingTabIndex,  │
│   Typeahead NFD, DismissableLayer, Positioner, Portal, LiveRegion, I18n   │
│ • 8 Máquinas Headless: Button, Dialog, Menu, Tabs, Tooltip, Select,       │
│   Toast, Accordion (Contratos Prop-Getters + Store Reativa subscribe())   │
└───────────┬─────────────────────────┬─────────────────────────┬───────────┘
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ Camada 3A:            │ │ Camada 3B:            │ │ Camada 3C:            │
│ @forma-ui/react       │ │ @forma-ui/vue         │ │ @forma-ui/svelte      │
│ useSyncExternalStore  │ │ ref + provide/inject  │ │ ReadableStore ($store)│
│ + createPortal        │ │ + Teleport            │ │ + use:actions         │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │ (Opcional / Plugável)
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Camada 4: @forma-ui/themes                                                │
│ Temas Light, Dark e High-Contrast (WCAG AAA) aplicando estilos apenas     │
│ sobre seletores de atributos [data-forma-*] e [data-state].               │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Camada 5: Qualidade, Documentação Viva & Evolução SemVer                  │
│ • @forma-ui/a11y-testing (axe-core + simuladores de teclado/foco)         │
│ • @forma-ui/codemods (CLI forma-codemod para migração SemVer)             │
│ • apps/docs (Playground interativo com inspetor ARIA/axe-core ao vivo)    │
└───────────────────────────────────────────────────────────────────────────┘
```

## 2. Contrato de Máquinas de Estado e Prop-Getters
Cada componente em `@forma-ui/core` segue o padrão **State Machine + Prop Getters**:
- **Estado Determinístico (`getState()`):** Retorna um objeto imutável representando o estado atual (`open`, `highlightedIndex`, `selectedValues`, `dir`, etc.).
- **Assinatura Reativa (`subscribe(listener)`):** Notifica adaptadores de qualquer framework de forma síncrona e previsível, retornando uma função `unsubscribe()`.
- **Prop Getters (`getTriggerProps()`, `getContentProps()`, `getItemProps()`):** Retornam todos os atributos HTML, ARIA (`role`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-labelledby`, `aria-describedby`, `aria-modal`, `aria-selected`, `aria-checked`), `data-forma-*`, `data-state` e handlers de eventos compostos (`composeEventHandlers`).

## 3. Estratégia de Empacotamento e Tree-Shaking
- **Bundler:** Rollup com `@rollup/plugin-typescript`, `@rollup/plugin-node-resolve` e `rollup-plugin-dts`.
- **Multi-Entry Subpaths:** Em `@forma-ui/core`, cada componente possui seu próprio entry point (`@forma-ui/core/button`, `@forma-ui/core/dialog`, etc.), permitindo que bundlers consumidores (Vite, Webpack, esbuild, Rollup) eliminem 100% do código de componentes não importados (`"sideEffects": false`).
- **Dual Module Format:** Todos os pacotes emitem simultaneamente ES Modules (`.mjs`) e CommonJS (`.cjs`) acompanhados de declarações TypeScript estritas (`.d.ts`) e sourcemaps.
