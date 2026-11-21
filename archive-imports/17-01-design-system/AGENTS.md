# AGENTS.md — Diretrizes de Engenharia e Arquitetura (@forma-ui)

Este documento define as regras obrigatórias de arquitetura, acessibilidade, tipagem e empacotamento para qualquer agente de IA ou engenheiro que mantenha ou expanda este monorepo.

## 1. Princípios Inegociáveis
1. **100% Headless por Padrão:** Nenhum pacote de comportamento (`@forma-ui/core`, `@forma-ui/react`, `@forma-ui/vue`, `@forma-ui/svelte`) pode importar arquivos `.css`, injetar `<style>` obrigatórios ou impor classes utilitárias (como Tailwind).
2. **Semântica HTML Nativa Antes de ARIA:** Utilize `<button type="button">`, `hidden`, `<input type="hidden">` e cabeçalhos semânticos `<h3>` sempre que disponíveis. Atributos `role="button"` e `tabIndex={0}` são aplicados apenas quando o consumidor solicita polimorfismo explícito (`elementType="div" | "span" | "a"`).
3. **Contratos de Estado via Data Attributes:** A comunicação com a camada visual opcional (`@forma-ui/themes` ou CSS do consumidor) ocorre exclusivamente via atributos semânticos:
   - `data-forma-<componente>[-<parte>]`
   - `data-state="open | closed | active | inactive | checked | unchecked | pressed | unpressed | idle"`
   - `data-highlighted=""`, `data-disabled=""`, `data-loading=""`, `data-orientation="horizontal | vertical"`
4. **Tree-Shaking Estrito:** Todos os pacotes de componentes devem preservar `"sideEffects": false` (exceto `@forma-ui/themes` para `**/*.css`) e expor subpaths individuais em `package.json#exports`.

## 2. Topologia de Dependências do Monorepo
- `@forma-ui/tokens`: Zero dependências externas. Exporta escalas, tokens semânticos, variáveis CSS `--forma-*`, formato W3C DTCG JSON e motor matemático de contraste WCAG 2.1.
- `@forma-ui/core`: Zero dependências de runtime externas. Contém 13 módulos de primitivas (`FocusTrap`, `ScrollLock`, `AriaHideOutside`, `RovingTabIndex`, `Typeahead`, `DismissableLayer`, `FloatingPositioner`, `Portal`, `LiveRegion`, `I18n/RTL`, `Keyboard`, `DOM`, `ID`) e as 8 máquinas de estado do MVP.
- `@forma-ui/react` / `@forma-ui/vue` / `@forma-ui/svelte`: Dependem apenas de `@forma-ui/core` e de seus respectivos frameworks como `peerDependencies`.
- `@forma-ui/themes`: Depende apenas de `@forma-ui/tokens`.
- `@forma-ui/a11y-testing`: Depende de `axe-core` para auditorias automatizadas WCAG/WAI-ARIA.
- `@forma-ui/codemods`: Zero dependências pesadas de runtime; executa migrações AST/regex determinísticas entre versões SemVer.

## 3. Checklist de Validação Antes de Commits ou Releases
- `pnpm lint`: Zero avisos ou erros ESLint; proibido uso de `any` explícito.
- `pnpm typecheck`: Verificação `tsc --noEmit` com `strict: true` e `noUncheckedIndexedAccess: true`.
- `pnpm build`: Compilação Rollup gerando `.mjs`, `.cjs`, `.d.ts`, `tokens.json` e `styles.css`.
- `pnpm verify:exports`: Confirma que todos os caminhos declarados em `exports` existem fisicamente em `dist/` e que não há dependências circulares.
- `pnpm test` & `pnpm test:a11y`: Execução completa das suítes Vitest e auditoria `axe-core` com zero violações.
