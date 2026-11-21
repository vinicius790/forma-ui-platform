# Pesquisa de repositórios e tecnologias de referência

**Data da verificação de metadados:** 17 de novembro de 2026  
**Escopo:** repositórios públicos, documentação oficial e padrões relevantes para bibliotecas headless, acessibilidade, máquinas de estado, adapters, posicionamento, dados, tokens, testes e distribuição.

Esta pesquisa é uma varredura técnica curada, não uma afirmação de que literalmente toda a Internet foi examinada. Os repositórios foram usados para estudar problemas, APIs e decisões de arquitetura. Nenhum código-fonte foi copiado para este projeto. Antes de qualquer reutilização futura, a licença, avisos de copyright, dependências e compatibilidade deverão ser verificados novamente.

## 1. Primitivas, comportamento e acessibilidade

| Projeto | Fonte | Licença observada no GitHub | Papel como referência | Decisão no Forma UI |
|---|---|---:|---|---|
| Radix Primitives | https://github.com/radix-ui/primitives | MIT | Composição de partes, foco, dismissable layers e comportamento de componentes | Referência para contratos, não para copiar implementação |
| React Aria / React Spectrum | https://github.com/adobe/react-spectrum · https://react-aria.adobe.com/ | Apache-2.0 | Interações detalhadas, input modality, i18n, leitor de tela e acessibilidade | Benchmark de comportamento e validação; o core permanece agnóstico de React |
| Ariakit | https://github.com/ariakit/ariakit · https://ariakit.org/ | Confirmar antes de reutilização | Composição, stores, widgets compostos e acessibilidade | Referência de ergonomia e arquitetura de estado |
| Zag.js | https://github.com/chakra-ui/zag · https://zagjs.com/ | MIT | State machines multi-framework e contratos de transição | Referência para transições e separação de efeitos |
| Ark UI | https://github.com/chakra-ui/ark · https://ark-ui.com/ | MIT | Component APIs em React, Vue, Solid e Svelte | Benchmark de composição e consistência de adapters |
| Base UI | https://github.com/mui/base-ui · https://base-ui.com/ | MIT | Componentes sem estilo, APIs controladas e qualidade de interação | Benchmark para APIs públicas e testes de regressão |
| Melt UI | https://github.com/melt-ui/melt-ui | MIT (confirmar antes de reutilização) | Builders headless e actions Svelte | Referência de ergonomia; atividade e compatibilidade devem ser reavaliadas |
| Kobalte | https://github.com/kobaltedev/kobalte · https://kobalte.dev/ | MIT | Componentes acessíveis SolidJS | Benchmark específico do adapter Solid |
| Angular CDK | https://github.com/angular/components · https://material.angular.dev/cdk | MIT | Overlay, a11y, foco e infraestrutura Angular | Referência de integração; o Forma não pretende substituí-lo |
| Lion | https://github.com/ing-bank/lion | MIT | Web Components white-label e funcionalidades fundamentais | Benchmark Lit/Web Components |

## 2. Dados, coleções e componentes de alta densidade

| Projeto | Fonte | Licença observada | O que estudar | Limite deliberado do Forma UI |
|---|---|---:|---|---|
| TanStack Virtual | https://github.com/TanStack/virtual | MIT | Medidas dinâmicas, scroll, virtualização headless e adapters | O virtualizador atual é unidimensional e não anuncia paridade de lanes/masonry |
| TanStack Table | https://github.com/TanStack/table | MIT | Row models, filtros, sorting e adapters | `@forma-ui/data-grid` é um modelo menor, não um substituto geral |
| Standard Schema | https://github.com/standard-schema/standard-schema | MIT | Contrato neutro para validação de schemas | Preferir adaptadores ao invés de amarrar forms a uma biblioteca |
| Floating UI | https://github.com/floating-ui/floating-ui · https://floating-ui.com/docs/ | MIT | `computePosition`, middleware, `autoUpdate`, clipping e collision handling | Dependência opcional; `autoUpdate` apenas enquanto a superfície estiver montada/aberta e sempre com cleanup |

## 3. Testes, acessibilidade e distribuição

| Tecnologia | Fonte oficial | Licença / status observado | Aplicação |
|---|---|---|---|
| axe-core | https://github.com/dequelabs/axe-core | MPL-2.0 | Auditoria automatizada de um subconjunto de regras detectáveis; a licença deve ser respeitada em distribuição |
| Playwright | https://github.com/microsoft/playwright · https://playwright.dev/docs/ | Apache-2.0 | Testes reais de foco, teclado, viewport, navegador e screenshots |
| Storybook | https://storybook.js.org/docs/ | Projeto open source; verificar versão/licença antes de extensões | Desenvolvimento isolado, histórias e addon de acessibilidade |
| TypeScript Project References | https://www.typescriptlang.org/docs/handbook/project-references.html | Documentação oficial | Separar pacotes e limitar rebuilds em um workspace grande |
| Are The Types Wrong | https://github.com/arethetypeswrong/arethetypeswrong.github.io | Ferramenta de validação | Verificar exports ESM/CJS e declarações após empacotamento real |
| publint | https://publint.dev/ | Ferramenta de validação | Verificar manifestos e conteúdo de tarballs publicados |
| npm Trusted Publishing | https://docs.npmjs.com/trusted-publishers/ | Recurso oficial npm/OIDC | Evitar tokens npm de longa duração quando workflow, pacote e registry estiverem configurados corretamente |

## 4. Decisões técnicas resultantes

1. **Core sem dependência de framework:** estado, foco, teclado, semântica e primitivas DOM continuam em `@forma-ui/core`; os adapters respeitam os ciclos de vida de cada framework.
2. **Dependências opcionais e isoladas:** Floating UI, axe-core, Playwright, Storybook, Tailwind e UnoCSS não devem ser instalados por quem usa apenas o core.
3. **Não perseguir paridade por marketing:** um bridge de lifecycle Lit/Angular não será descrito como suíte completa de componentes. A cobertura está registrada em `adapter-coverage.md`.
4. **Não substituir ferramentas especialistas sem vantagem demonstrada:** `data-grid` e `virtualization` são soluções compactas de propósito específico. Para grids complexos e virtualização avançada, TanStack Table/Virtual permanecem alternativas válidas.
5. **Testes em camadas:** teste puro de controller, teste de adapter, axe-core, navegador real e revisão manual com tecnologias assistivas são gates distintos.
6. **Compatibilidade e licenças antes de adoção:** metadados foram consultados em 17/11/2026, mas devem ser reconfirmados no momento de fixar uma versão ou incorporar código.

## 5. Referências normativas e de plataforma

- WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- DTCG Format 2025.10: https://www.designtokens.org/TR/2025.10/
- DTCG FAQ/status: https://www.designtokens.org/faq/
- Floating UI `autoUpdate`: https://floating-ui.com/docs/autoupdate
- TanStack Table — virtualização: https://tanstack.com/table/latest/docs/guide/virtualization
- npm Trusted Publishing: https://docs.npmjs.com/trusted-publishers/

O formato DTCG 2025.10 é a primeira versão estável do Design Tokens Community Group, mas não é um padrão W3C na W3C Standards Track. O projeto não deve rotulá-lo como “W3C Standard”.

## 6. Ecossistema de Web Components, design systems e qualidade de desenvolvimento

| Projeto | Fonte | Licença observada no GitHub | Uso como referência | Cuidado de adoção |
|---|---|---:|---|---|
| Lit | https://github.com/lit/lit | BSD-3-Clause | Ciclo de vida, propriedades reativas e custom elements | O bridge Forma não deve duplicar o runtime de Lit |
| Open WC | https://github.com/open-wc/open-wc | MIT | Ferramentas, testes e práticas para Web Components | Adotar apenas ferramentas que resolvam lacunas reais |
| Fluent UI | https://github.com/microsoft/fluentui | NOASSERTION no metadado consultado | Escopo de design system corporativo e Web Components | NOASSERTION não confirma licença; não reutilizar código sem revisão jurídica |
| Primer React | https://github.com/primer/react | MIT | Documentação de sistema de design e padrões de componentes React | Benchmark de consistência, não dependência de runtime |
| Testing Library DOM | https://github.com/testing-library/dom-testing-library | MIT | Testes orientados ao comportamento acessível do usuário | Preferir consultas por role/nome em vez de detalhes internos |
| MSW | https://github.com/mswjs/msw | MIT | Interceptação determinística de rede em testes de estados assíncronos | Adicionar quando houver testes reais de fetch, sem usar mocks frágeis |
| Vitest | https://github.com/vitest-dev/vitest | MIT | Testes unitários rápidos e integração com Vite | Browser Mode ainda requer configuração e navegador compatível |
| Changesets | https://github.com/changesets/changesets | MIT | Versionamento independente em monorepos | Exigir changelog e revisão de breaking changes |
| pnpm | https://github.com/pnpm/pnpm | MIT | Workspaces e instalação eficiente | Fixar versão e manter lockfile versionado antes de releases |
| ESLint | https://github.com/eslint/eslint | MIT | Regras próprias e flat config | Plugin Forma é opcional; não deve impor estilo visual |
| Tailwind CSS | https://github.com/tailwindlabs/tailwindcss | MIT | Tokens de tema e integração CSS-first | O bridge não substitui a API completa do Tailwind |
| Storybook | https://github.com/storybookjs/storybook | MIT | Catálogo isolado, testes e documentação visual | Storybook é ferramenta de desenvolvimento, nunca runtime obrigatório |

**Nota sobre metadados:** `NOASSERTION` significa que a API de repositório não forneceu um identificador SPDX conclusivo no momento da consulta. Não equivale a MIT, Apache-2.0 ou autorização automática de reutilização.

## 7. Estratégia de dependências derivada da pesquisa

- **Core:** não recebe React, Vue, Svelte, Solid, Lit, Angular, Floating UI, Tailwind, UnoCSS, axe-core, Playwright, Storybook, MSW ou bibliotecas de formulários como dependências de runtime.
- **Adapters:** dependências de framework são peers opcionais; integrações de ciclo de vida não se apresentam como componente pronto quando só oferecem bridge.
- **Floating UI:** `autoUpdate` é ativado somente enquanto o elemento flutuante está montado e aberto, com cleanup obrigatório ao fechar/desmontar.
- **Virtualização e tabelas:** a implementação própria é propositalmente compacta; grids extensos, virtualização em duas dimensões, lanes e window scrolling devem ser avaliados com TanStack Table/Virtual, não replicados de forma incompleta.
- **Design tokens:** gerar export DTCG 2025.10 e manter teste de round-trip. A compatibilidade de ferramentas de transformação precisa ser verificada por versão; não presumir suporte integral ao formato mais recente.
- **Testes:** combinar Vitest, Testing Library, axe-core, Playwright e testes manuais. Nenhuma camada isolada é prova suficiente de conformidade.
- **Publicação:** usar OIDC Trusted Publishing e provenance quando o repositório, workflow e pacote estiverem configurados como trusted publisher. A configuração npm exige npm CLI compatível e Node suportado.

## 8. Fontes oficiais consultadas nesta rodada

- Storybook — [Accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing) e [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon).
- Playwright — [Accessibility testing](https://playwright.dev/docs/accessibility-testing): automação detecta problemas comuns, mas testes manuais e avaliação inclusiva continuam necessários.
- DTCG — [Format 2025.10](https://www.designtokens.org/TR/2025.10/format/) e [FAQ/status](https://www.designtokens.org/faq/): formato estável do Community Group, não um padrão W3C na Standards Track.
- Style Dictionary — [DTCG integration note](https://styledictionary.com/info/dtcg/): verificar suporte efetivo do release utilizado antes de assumir compatibilidade plena com 2025.10.
- npm — [Trusted publishing](https://docs.npmjs.com/trusted-publishers/): OIDC elimina a necessidade de tokens de longa duração e pode gerar atestação de provenance quando os pré-requisitos são atendidos.
- TanStack Virtual — [Repository and capabilities](https://github.com/TanStack/virtual): virtualização headless, com layouts verticais/horizontais e grid, além de dimensionamento medido.

