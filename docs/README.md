# Forma UI — Documentação e Arquitetura (`docs/`)

Índice estruturado de toda a documentação técnica, especificações, relatórios de auditoria e decisões arquiteturais (ADRs) do **Forma UI `100.0.0`**.

## 1. Arquitetura & Visão da Plataforma
- [platform-guide.md](./platform-guide.md) — Guia consolidado da plataforma `100.0.0` (31 pacotes, 70 controllers, 32 primitivas e corpus > 1 GB).
- [architecture.md](./architecture.md) — Modelo em camadas, isolamento de runtime e ciclo de vida.
- [component-catalog.md](./component-catalog.md) — Contratos comportamentais dos controladores headless.
- [adapter-coverage.md](./adapter-coverage.md) — Matriz de paridade e exports reais nos adapters de framework.
- [ecosystem-and-integrations.md](./ecosystem-and-integrations.md) — Estratégia para frameworks, estilização e ferramentas.
- [ssr-and-framework-recipes.md](./ssr-and-framework-recipes.md) — SSR, hidratação, Declarative Shadow DOM e receitas por framework.

## 2. Acessibilidade, Internacionalização & Design Tokens
- [accessibility-wcag.md](./accessibility-wcag.md) — Contrato WAI-ARIA APG e WCAG 2.2.
- [i18n-and-rtl.md](./i18n-and-rtl.md) — Espelhamento direcional RTL, propriedades lógicas e localização.
- [design-tokens.md](./design-tokens.md) — Camadas semânticas, OKLCH, APCA e exportação/importação W3C DTCG.

## 3. Qualidade, Performance, Benchmarks & Testes
- [testing-strategy.md](./testing-strategy.md) — Política de testes unitários, propriedades, a11y e browser (Playwright).
- [quality-gates.md](./quality-gates.md) — Gates obrigatórios de verificação e empacotamento.
- [performance-and-memory.md](./performance-and-memory.md) — Orçamento de memória, teardown idempotente e virtualização.
- [benchmark-fixtures.md](./benchmark-fixtures.md) — Corpus sintético determinístico multi-domínio (> 1 GB).

## 4. Governança, Segurança, Releases & Auditorias
- [roadmap.md](./roadmap.md) — Marcos evolutivos e estado da plataforma.
- [versioning-and-codemods.md](./versioning-and-codemods.md) — SemVer, Changesets e migrações automatizadas por AST.
- [release-and-security.md](./release-and-security.md) — Provenance, supply-chain e controles de publicação.
- [legal-release-checklist.md](./legal-release-checklist.md) — Governança SPDX e licença MIT.
- [dependency-policy.md](./dependency-policy.md) — Política de zero dependências no core e peer dependencies nos adapters.
- [validation-report.md](./validation-report.md) — Relatório de verificações executadas e escopo auditado.
- [archive-layout.md](./archive-layout.md) & [release-archive-audit.md](./release-archive-audit.md) — Política de arquivo e auditoria SHA-256.
- [source-merge-report.md](./source-merge-report.md) & [legacy-api-assessment.md](./legacy-api-assessment.md) — Reconciliação histórica ZIP + RAR (`archive-imports/`).
