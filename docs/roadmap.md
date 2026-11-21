# Roadmap do Forma UI

**Snapshot atual:** `100.0.0` — 31 pacotes (8 adapters de framework + `@forma-ui/devtools` + `@forma-ui/ai-ui` + `@forma-ui/crdt`), 97 módulos de runtime no core (64 controllers + 32 primitivas), verificação real em runtime Node 24 (`v10`+`v50`+`v100`) e auditoria integral aprovada.

O roadmap separa implementação de validação. Uma API presente no código não é considerada pronta para produção até que tenha cobertura de contrato, teste de framework e evidência de execução no ambiente declarado.

## 0.3 — Fundação ampliada (implementação-fonte presente)

- [x] Expandir o core com primitivas de foco, teclado, camadas, portal, posicionamento, i18n, typeahead, coleções e máquinas de estado.
- [x] Adicionar controladores para os componentes originais e controles adicionais, incluindo checkbox, switch, radio group, slider, progress, separator, breadcrumb, pagination, disclosure, combobox, listbox, tree view, grid e pin input.
- [x] Separar pacotes para collections, dates, forms, commands, data-grid, virtualization, motion, SSR e testing.
- [x] Disponibilizar integrações/adapters para React, Vue, Svelte, Solid, Preact, Lit e Angular, sem afirmar paridade funcional total entre eles.
- [x] Criar bridges opcionais para Floating UI, Tailwind CSS e UnoCSS.
- [x] Criar CLI, plugin ESLint, codemods, harness Playwright, testes de acessibilidade e Storybook.
- [x] Incluir inventário de dependências declaradas, inventário de testes/histórias, mapa arquitetural, pesquisa de referências e verificadores de estrutura.
- [x] Estabelecer grafo de dependências sem ciclos de runtime e regra de que o core não importa frameworks nem CSS.

### Gates de validação ainda abertos para 0.3

- [ ] Instalar a árvore completa e gerar/versionar `pnpm-lock.yaml` em ambiente com acesso ao registry.
- [ ] Compilar todos os pacotes e adapters com versões reais das dependências e declarações externas.
- [ ] Executar integralmente Vitest, testes de integração e suites axe-core.
- [ ] Gerar builds de produção de Docs e Storybook e corrigir quaisquer erros de integração.
- [ ] Executar Playwright em Chromium, Firefox e WebKit; adicionar baselines visuais apenas após estabilizar fontes, sistema operacional e renderer.
- [ ] Executar `publint` e Are The Types Wrong nos tarballs gerados de todos os pacotes.
- [ ] Revisar a cobertura por framework/componente e marcar explicitamente cada combinação como completa, parcial ou não suportada.

## 0.4 — Paridade e contratos de adapters

- [ ] Definir fixtures compartilhadas de contrato para foco, teclado, ARIA, controlled/uncontrolled, cleanup e SSR/hidratação.
- [ ] Expandir adapters Solid, Angular, Lit, Preact, Vue e Svelte com base em gaps da matriz `docs/adapter-coverage.md`.
- [ ] Completar suporte a Combobox, Menu, Dialog, Select e Toast em cada adapter antes de declarar paridade.
- [ ] Criar testes comparativos que executem os mesmos casos de interação em todos os adapters que declaram suporte.
- [ ] Documentar limites e diferenças de API inevitáveis entre frameworks.

## 0.5 — Browser, visual regression e tecnologias assistivas

- [ ] Rodar testes reais em Chromium, Firefox e WebKit e projetos mobile viewport/touch.
- [ ] Adicionar casos de forced-colors, prefers-reduced-motion, zoom, teclado-only e orientação.
- [ ] Testar dialogs aninhados, portais, nested dismissable layers, scroll lock, foco restaurado e popovers dentro de scroll containers.
- [ ] Estabelecer screenshots de referência com ambiente pinado; revisar diffs visualmente antes de atualizar snapshots.
- [ ] Fazer revisão manual com NVDA/Firefox, NVDA/Chromium, VoiceOver/Safari e TalkBack/Chrome quando esses ambientes estiverem disponíveis.
- [ ] Publicar uma matriz de evidências por componente, browser e tecnologia assistiva; não converter resultado de axe em alegação de conformidade WCAG.

## 0.6 — Publicação, segurança e governança

- [ ] Selecionar formalmente a licença do projeto; criar `LICENSE` e preencher SPDX em todos os pacotes publicáveis.
- [ ] Gerar e versionar lockfile; produzir SBOM CycloneDX ou SPDX com versões resolvidas e hashes.
- [ ] Executar revisão de licenças/transitive dependencies e registrar avisos de terceiros.
- [ ] Validar tarballs com `publint`, Are The Types Wrong e instalação em projetos-consumidor limpos.
- [ ] Configurar npm Trusted Publishing/OIDC e provenance em workflow aprovado; evitar tokens de longa duração.
- [ ] Fazer release canário, testar migrações/codemods em fixtures reais e documentar rollback.

## Critérios para 1.0

A release estável exige todos os itens abaixo, com evidências anexadas ao repositório:

1. Contratos dos adapters aprovados para cada combinação anunciada como suportada.
2. Build, typecheck, testes unitários, integração, browser e package-consumer em CI verde.
3. Auditoria de acessibilidade automatizada e revisão manual de tecnologias assistivas concluídas.
4. Política de API, SemVer, mudanças incompatíveis e codemods testada.
5. Licença, avisos de terceiros, lockfile, SBOM e pipeline de publicação confiável concluídos.
6. Documentação atualizada e exemplos instaláveis a partir de tarballs reais.

**Não é critério de qualidade:** número de dependências, quantidade de linhas, tamanho do ZIP ou número bruto de componentes. A expansão deve ser guiada por necessidades demonstráveis, comportamento correto e custo de manutenção sustentável.
