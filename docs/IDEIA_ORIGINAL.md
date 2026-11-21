# 17.1 Design system + biblioteca de componentes headless

> Registro do resumo original fornecido antes da implementação. O status “ainda não implementado” abaixo é histórico e não descreve o estado atual do repositório.

Biblioteca de UI agnóstica de estilo (comportamento + acessibilidade, sem CSS imposto) publicada como pacote versionado, com tokens de design e documentação viva.
Arquitetura: tokens (cores, espaçamento, tipografia) → primitivas headless (foco, teclado, ARIA, portais) → camada visual opcional (temas) → docs interativas + testes de acessibilidade.
MVP: 8 componentes (button, dialog, menu, tabs, tooltip, select, toast, accordion) com foco/teclado corretos, build tree-shakeable e publicado em registry.
Versão completa: temas plugáveis, i18n/RTL, testes de acessibilidade automáticos no CI, pacote multi-framework (React/Vue/Svelte via camada core), changelog semver e migração automatizada (codemods).
Stack: TypeScript, Rollup/esbuild, Testing Library, axe-core. Não entregue “mais um Tailwind kit”: o valor é a camada headless + acessibilidade.

---

Estrutura inicial apenas. O projeto ainda não está implementado.
