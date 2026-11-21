# Landscape de pesquisa — Forma UI

**Escopo da pesquisa:** bibliotecas headless, máquinas de estado, acessibilidade, adapters multi-framework, posicionamento, tokens, formulários, virtualização, testes e ferramentas de distribuição.  
**Objetivo:** identificar padrões de engenharia que possam ser adaptados ao Forma UI sem copiar implementações, misturar licenças ou introduzir dependências obrigatórias desnecessárias.

> Esta é uma curadoria técnica ampla, não uma afirmação de que todos os repositórios da internet foram examinados. URLs, licenças e versões devem ser reconfirmadas antes de adotar código ou fixar dependências. A pesquisa informa decisões; não substitui testes do Forma UI.

## 1. Bibliotecas de componentes headless e acessibilidade

| Projeto | Repositório / documentação | O que estudar | Decisão para Forma UI |
|---|---|---|---|
| Radix Primitives | [radix-ui/primitives](https://github.com/radix-ui/primitives) · [docs](https://www.radix-ui.com/primitives) | composição Root/Trigger/Content, portais, layers, foco e APIs controladas | Referência para contratos composicionais e comportamento previsível; não copiar código sem revisão de licença e atribuição |
| React Aria | [adobe/react-spectrum](https://github.com/adobe/react-spectrum) · [React Aria](https://react-aria.adobe.com/) | press, focus, hover, interação móvel, internacionalização, leitores de tela e hooks | Benchmark de qualidade de interação; APIs e abstrações específicas de React não devem contaminar o core |
| Ariakit | [ariakit/ariakit](https://github.com/ariakit/ariakit) · [docs](https://ariakit.org/) | store-driven composition, composite widgets, foco e menus | Comparar ergonomia de stores e composição de widgets |
| Zag.js | [chakra-ui/zag](https://github.com/chakra-ui/zag) · [docs](https://zagjs.com/) | máquinas de estado framework-agnostic, efeitos, transições e adapters | Inspiração para separar transições de ciclo de vida; o runtime interno do Forma continua pequeno e explicitamente limitado a estados planos |
| Ark UI | [chakra-ui/ark](https://github.com/chakra-ui/ark) · [docs](https://ark-ui.com/) | projeção de máquinas em componentes Root/Part para React, Vue, Solid e Svelte | Referência para desenho de APIs por framework e consistência de peças |
| Base UI | [mui/base-ui](https://github.com/mui/base-ui) · [docs](https://base-ui.com/) | componentes não estilizados, API controlada, comportamento de overlay e testes | Benchmark de API e política de breaking changes |
| Melt UI | [melt-ui/melt-ui](https://github.com/melt-ui/melt-ui) | builders para Svelte, actions e composição | Comparar ergonomia de actions/stores; adapter Svelte deve respeitar o modelo reativo do Svelte 5 |
| Kobalte | [kobaltedev/kobalte](https://github.com/kobaltedev/kobalte) · [docs](https://kobalte.dev/) | acessibilidade e composição em Solid | Benchmark específico para o adapter Solid |
| Angular CDK | [angular/components](https://github.com/angular/components) · [CDK](https://material.angular.dev/cdk/categories) | Overlay, Dialog, A11y, FocusMonitor e integração com ciclo de vida Angular | Preferir serviços/bridges que respeitem `DestroyRef`, Signals e APIs oficiais; não importar CDK no core |
| Lion | [ing-bank/lion](https://github.com/ing-bank/lion) | Web Components acessíveis e APIs por custom element | Referência para integração Lit/Web Components e contratos independentes de framework |

**Síntese:** o Forma UI deve escolher uma única fonte comportamental por componente e manter o código de framework em adapters finos. Suporte multi-framework não significa que uma API idêntica seja ideal em todos os frameworks: o mesmo contrato de estado/teclado pode ser projetado por hooks, composables, stores, signals, controllers Lit ou diretivas Angular.

## 2. Posicionamento e camadas flutuantes

| Projeto | Referência | Uso potencial |
|---|---|---|
| Floating UI | [floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) · [middleware](https://floating-ui.com/docs/middleware) · [autoUpdate](https://floating-ui.com/docs/autoupdate) | collision handling, `flip`, `shift`, `size`, arrow, hide e atualizações ao scroll/resize |
| Popover API | [MDN](https://developer.mozilla.org/docs/Web/API/Popover_API) | usar top layer nativa quando suportada e adequada; não confundir Popover com Dialog modal |
| CSS Anchor Positioning | [MDN](https://developer.mozilla.org/docs/Web/CSS/CSS_anchor_positioning) | progressive enhancement de posicionamento, com fallback e detecção de suporte |

**Regra de integração:** `@forma-ui/core` permanece livre de dependência de geometria externa. `@forma-ui/floating-ui` é opcional; `autoUpdate` só deve existir enquanto a superfície flutuante estiver ativa e deve ser sempre encerrado no fechamento/desmontagem. A documentação oficial do Floating UI alerta que manter atualizações ativas para overlays fechados pode degradar desempenho.

## 3. Tokens, estilos e apresentação

| Projeto / padrão | Referência | Decisão |
|---|---|---|
| Design Tokens Community Group | [Format 2025.10](https://www.designtokens.org/TR/2025.10/format/) | exportação interoperável do pacote `tokens`; o relatório 2025.10 é uma especificação estável do Community Group, não um W3C Standard nem documento da W3C Standards Track |
| Style Dictionary | [amzn/style-dictionary](https://github.com/amzn/style-dictionary) | futura integração opcional para transformar tokens em CSS, JS, iOS/Android e artefatos de marca |
| Tailwind CSS | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) · [theme variables](https://tailwindcss.com/docs/theme) | adaptar tokens a `@theme` v4 e compatibilidade separada v3; nunca exigir Tailwind |
| UnoCSS | [unocss/unocss](https://github.com/unocss/unocss) · [presets](https://unocss.dev/guide/presets) | preset opcional, sem impor reset ou classes ao usuário |
| Panda CSS | [chakra-ui/panda](https://github.com/chakra-ui/panda) · [docs](https://panda-css.com/) | estudar recipes/slot recipes e emissão em build-time; integrar apenas quando houver fixture real de consumo e teste de API |
| Open Props | [open-props/open-props](https://github.com/argyleink/open-props) | referência de tokens CSS públicos e composição, não dependência base |

O pacote deve distinguir tokens primitivos, semânticos e de componente. Contrastes precisam ser testados sobre combinações semânticas reais, e não apenas sobre a paleta primitiva.

## 4. Formulários e validação

| Projeto / padrão | Referência | Oportunidade |
|---|---|---|
| Standard Schema | [standard-schema/standard-schema](https://github.com/standard-schema/standard-schema) · [spec](https://standardschema.dev/) | protocolo neutro para integrar Zod, Valibot, ArkType e outros sem importar um validador no core |
| Zod | [colinhacks/zod](https://github.com/colinhacks/zod) | adapter de validação opcional |
| Valibot | [fabian-hiller/valibot](https://github.com/fabian-hiller/valibot) | adapter modular e leve opcional |
| ArkType | [arktypeio/arktype](https://github.com/arktypeio/arktype) | validar compatibilidade via Standard Schema |
| TanStack Form | [TanStack/form](https://github.com/TanStack/form) | referência para estado de campo, validação assíncrona, submit e integrações framework |
| React Hook Form | [react-hook-form/react-hook-form](https://github.com/react-hook-form/react-hook-form) | referência de uncontrolled fields e performance de formulários React |

O motor de formulários deve continuar separado de um renderer. Integrações com bibliotecas de schema são bridges opcionais, e mensagens de validação devem ser localizáveis pelo consumidor.

## 5. Virtualização, coleções e dados extensos

| Projeto | Referência | O que aprender |
|---|---|---|
| TanStack Virtual | [TanStack/virtual](https://github.com/TanStack/virtual) | virtualização headless, variável tamanho, lanes, scroll element e adaptadores |
| React Virtuoso | [petyosi/react-virtuoso](https://github.com/petyosi/react-virtuoso) | listas complexas, cabeçalhos agrupados e manutenção de scroll |
| React Window | [bvaughn/react-window](https://github.com/bvaughn/react-window) | baseline simples para windowing |
| TanStack Table | [TanStack/table](https://github.com/TanStack/table) | coleções, sorting, filtering e seleção desacoplados de UI |
| MUI X Tree View | [mui/mui-x](https://github.com/mui/mui-x) | navegação hierárquica e modelos de árvore |

O virtualizador do Forma UI é intencionalmente menor que TanStack Virtual. Não deve alegar paridade com lanes, masonry, scroll anchoring ou virtualização de grids até que essas capacidades tenham implementação e testes dedicados.

## 6. Motion e redução de movimento

| Recurso | Referência | Regra |
|---|---|---|
| `prefers-reduced-motion` | [MDN](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion) | fornecer tokens e utilitários para respeitar preferência do sistema |
| Motion One | [motiondivision/motion](https://github.com/motiondivision/motion) | integração opcional de animação, nunca runtime obrigatório do core |
| Web Animations API | [MDN](https://developer.mozilla.org/docs/Web/API/Web_Animations_API) | API nativa para casos simples e sem pacote extra |

Nenhuma animação pode ser condição para compreender estado ou completar ação. Evitar movimento não essencial e permitir que o consumidor controle duração e transição.

## 7. Testes, auditoria e observabilidade

| Projeto | Referência | Aplicação |
|---|---|---|
| Vitest | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) · [Browser Mode](https://vitest.dev/guide/browser/) | unit e browser tests próximos da API de testes do projeto |
| Playwright | [microsoft/playwright](https://github.com/microsoft/playwright) | fluxos reais Chromium/Firefox/WebKit, emulações, teclado, foco e screenshot |
| axe-core | [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | detectar parte dos problemas automatizáveis; não certifica WCAG |
| Storybook | [storybookjs/storybook](https://github.com/storybookjs/storybook) · [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) | catálogo de estados, interação e testes de stories |
| Testing Library | [testing-library](https://github.com/testing-library) | teste orientado a comportamento do usuário e semântica |
| fast-check | [dubzzz/fast-check](https://github.com/dubzzz/fast-check) | testes baseados em propriedades para ranges, coleções e invariantes |
| Lighthouse CI | [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci) | monitoramento de regressões de performance e boas práticas em app de demonstração |
| size-limit | [ai/size-limit](https://github.com/ai/size-limit) | orçamento de bundle por entry point |

As verificações devem ser complementares: unitários para transições; contract tests para adapters; browser tests para DOM/foco/scroll; axe para problemas detectáveis; análise manual com leitores de tela e ampliação/zoom para comportamento real.

## 8. Distribuição, repositório e cadeia de suprimentos

| Ferramenta | Referência | Objetivo |
|---|---|---|
| pnpm workspaces | [pnpm/pnpm](https://github.com/pnpm/pnpm) | workspace e lockfile reprodutível |
| Changesets | [changesets/changesets](https://github.com/changesets/changesets) | SemVer por pacote e changelog |
| publint | [publint](https://github.com/publint/publint) | validar pacotes publicados |
| Are The Types Wrong | [arethetypeswrong/arethetypeswrong.github.io](https://github.com/arethetypeswrong/arethetypeswrong.github.io) | detectar problemas de resolução de declarações ESM/CJS |
| API Extractor | [microsoft/rushstack](https://github.com/microsoft/rushstack) | opcional para contratos/declarations e API reports quando o número de pacotes justificar |
| Knip | [webpro/knip](https://github.com/webpro/knip) | detectar exports, arquivos e dependências não usados |
| Renovate | [renovatebot/renovate](https://github.com/renovatebot/renovate) | atualizar dependências com PRs controlados |
| CodeQL | [github/codeql](https://github.com/github/codeql) | análise estática de segurança |
| OpenSSF Scorecard | [ossf/scorecard](https://github.com/ossf/scorecard) | avaliar práticas de segurança do repositório |
| Sigstore / npm provenance | [sigstore](https://github.com/sigstore) · [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) | integridade e proveniência de releases quando configurado |

## 9. Matriz de adoção

| Iniciativa | Impacto esperado | Custo/risco | Estado no repositório |
|---|---|---|---|
| Core comportamental sem framework | Muito alto | Médio | Implementado para os controllers listados no catálogo |
| Adapter multi-framework fino | Muito alto | Alto | Parcial; ver matriz de cobertura |
| Testes reais em navegador | Muito alto | Médio/alto | Configurados; execução integral ainda pendente |
| DTCG 2025.10 | Alto | Baixo/médio | Exportador e validação inicial |
| Floating UI opcional | Alto | Baixo/médio | Bridge opcional |
| Form engine neutro + Standard Schema | Alto | Médio | Base inicial |
| Virtualização variável | Alto | Alto | Núcleo inicial, sem paridade TanStack |
| Datas/calendário date-only | Médio/alto | Médio | Base inicial; time zones e calendários não gregorianos ficam fora |
| Style Dictionary, Panda, Lighthouse CI, OpenSSF | Médio | Médio/alto | Referências de evolução; não incluir como runtime obrigatório |

## 10. Regras para adotar uma nova dependência

Uma dependência só deve ser adicionada quando cumprir todos os pontos aplicáveis:

1. Resolver uma necessidade concreta que não é melhor atendida por uma API nativa pequena.
2. Ter licença compatível, manutenção e política de segurança verificáveis.
3. Ser declarada em `dependencies`, `peerDependencies` ou `devDependencies` conforme o papel real.
4. Ser opcional quando não for necessária para o core ou para todos os consumidores.
5. Ter teste de integração com a versão mínima e a versão atual suportadas.
6. Ter impacto de bundle medido e divulgado.
7. Ter plano de remoção/substituição e política de breaking change.

Uma lista extensa de dependências não é uma métrica de qualidade. O critério é melhorar robustez, acessibilidade, ergonomia ou produtividade sem contaminar as camadas inferiores.
