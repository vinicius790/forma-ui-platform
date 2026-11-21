# Forma UI — relatório de validação do snapshot-fonte

**Data:** 17 de novembro de 2026  
**Versão declarada:** `0.3.0`  
**Status:** pré-1.0; estrutura auditada e validações focadas executadas; integração completa ainda pendente.

Este documento distingue verificações efetivamente executadas de verificações que não puderam ser realizadas. Um resultado positivo em checks estáticos ou smoke tests não representa prova de ausência de bugs, paridade entre frameworks, compatibilidade universal ou certificação WCAG.

## Escopo do snapshot

| Medida | Resultado observado |
|---|---:|
| Pacotes em `packages/` | 27 |
| Aplicações em `apps/` | 2 |
| Projetos no workspace (packages + apps) | 29 |
| Arquivos no snapshot auditado (incluindo o manifesto de arquivo; excluídos caches/builds) | 348 |
| Arquivos TypeScript/TSX de fonte não declarativa | 131 |
| Arquivos Markdown | 68 |
| Manifestos e dados JSON | 69 |
| Arquivos YAML | 7 |
| Arquivos de teste e histórias no inventário | 44 |
| Casos `test()`/`it()` identificados | 39 |
| Playwright spec files | 1 |
| Arquivos de histórias Storybook | 4 |

Os números são um inventário do snapshot-fonte, não uma métrica de maturidade nem uma medida de cobertura de código.

## Verificações executadas e aprovadas

| Área | Verificação | Resultado |
|---|---|---|
| Estrutura | Presença de manifesto, README e `src/` em todos os pacotes; arquivos críticos; JSON válido; arquivos não vazios | Aprovado — 27 pacotes, 2 apps, 348 arquivos, 69 JSON, 7 YAML, 38 caminhos críticos |
| Manifests | Nomes exclusivos, SemVer, exports, bins, scripts, files allowlist e dependências internas | Aprovado — 27 pacotes |
| Grafo | Dependências internas, projetos do workspace, ciclos de runtime e ordem topológica | Aprovado — 29 projetos, sem ciclos de runtime |
| Arquitetura | Core sem imports de framework nem CSS; presença de README e source em cada pacote | Aprovado — 48 módulos de runtime do core verificados |
| Documentação | Links relativos entre arquivos Markdown | Aprovado — 68 arquivos inspecionados |
| Higiene | Arquivos vazios, symlinks, nomes de secrets e padrões de credenciais no escopo do scanner | Aprovado — 348 arquivos; isso não substitui um scanner dedicado de segredos no Git history |
| TypeScript | Parsing/transpilação de sintaxe TypeScript/TSX | Aprovado — 131 arquivos, sem diagnóstico de sintaxe |
| TypeScript | Compilação estrita de fonte em core, tokens, dates, virtualization, commands, data-grid, collections, forms, motion, ssr, testing e themes | Aprovado com TypeScript 5.8.3; testes e adapters dependentes de pacotes externos não estão incluídos neste escopo focalizado |
| JavaScript | `node --check` nos arquivos `.mjs` | Aprovado — 51 arquivos |
| YAML | Parsing de workflows/configurações | Aprovado — 7 arquivos |
| CLI | Listagem de adapters, diagnóstico sem mutação, scaffolding, prevenção de sobrescrita e validação de framework | Aprovado — 5/5 testes Node.js |
| Core | Smoke tests em execução para controladores, formulários, Combobox, Slider, Pagination, RTL, typeahead, posicionamento e tokens | Aprovado em build temporário isolado |
| Extensões | Smoke tests em execução para DataGrid/ARIA e atualização de estado, Command Palette e corrida assíncrona, virtualizer/medição/transação e datas/locale | Aprovado em build temporário isolado |
| Empacotamento | `npm pack --dry-run` do pacote CLI | Aprovado — payload restrito a README, manifesto e artefato `dist` esperado |
| Inventários | Geração do inventário de dependências declaradas, testes/histórias, mapa arquitetural e manifesto de arquivo | Aprovado; 347 arquivos listados no manifesto e hashes SHA-256 recalculados; inventários não substituem SBOM resolvido |
| ZIP | Criação determinística a partir do manifesto, validação CRC e comparação do conjunto de membros | Script incluído; execução final do ZIP e checksum é registrada na entrega |

### Observações sobre os smoke tests

Os smoke tests foram executados sobre transpilação temporária do código-fonte com o compilador disponível. Um loader ESM temporário foi usado apenas para resolver imports relativos sem extensão produzidos pela compilação isolada. Esse procedimento não substitui o build Rollup oficial nem os testes do ambiente instalado com pnpm.

## Verificações não executadas

O ambiente de autoria não tinha pnpm instalado e as tentativas de acesso ao registry falharam por indisponibilidade de DNS/rede. Não há `pnpm-lock.yaml` resolvido neste snapshot. Por esse motivo, os seguintes itens não foram considerados aprovados:

1. `pnpm install` e geração/commit de `pnpm-lock.yaml`.
2. Build Rollup integral dos 27 pacotes, inclusive exports ESM e declarações finais.
3. Typecheck completo de todos os adapters contra as versões reais instaladas de React, Vue, Svelte, Solid, Preact, Lit, Angular e bibliotecas externas.
4. Suíte Vitest completa e testes de adapters com DOM real/jsdom.
5. Testes automatizados de `@forma-ui/eslint-plugin` — o processo não iniciou porque `eslint` não estava instalado; apenas a sintaxe foi verificada.
6. Auditorias axe-core integradas e testes completos de acessibilidade nos adapters.
7. Build de produção dos apps Docs e Storybook e verificação visual de cada história.
8. Testes Playwright reais nos motores Chromium, Firefox e WebKit e emulações móveis.
9. `publint` e Are The Types Wrong em tarballs de todos os pacotes.
10. Auditoria completa de dependências/transitivas, licenças e segurança a partir de lockfile.
11. Revisão manual com leitores de tela/tecnologias assistivas e avaliação humana WCAG.

## Bloqueios de release intencionais

### Licença do projeto

O dono do projeto ainda não selecionou uma licença. Não escolhi uma licença em nome do usuário. `scripts/check-legal-release.mjs` bloqueia a publicação até existir um `LICENSE` de raiz e identificadores SPDX adequados nos pacotes publicáveis. Isso é uma proteção, não um erro silencioso.

### Lockfile e SBOM

Sem instalação resolvida e lockfile não é possível afirmar versões transitivas, hashes de integridade ou licenças efetivas. `docs/dependency-inventory.json` declara explicitamente esse limite e não se apresenta como SBOM CycloneDX/SPDX.

## Sequência de validação em máquina de desenvolvimento

Requisitos declarados: Node.js `>=22.16.0` e pnpm `9.15.5`. Depois de instalar pnpm e obter acesso ao registry:

```bash
pnpm install
pnpm generate:inventory
pnpm generate:test-inventory
pnpm validate:source
pnpm lint
pnpm format:check
pnpm build
pnpm typecheck
pnpm verify:exports
pnpm check:publish
pnpm smoke
pnpm test
pnpm test:a11y
pnpm docs:build
pnpm storybook:build
pnpm test:e2e
```

A etapa de release deverá continuar bloqueada até resolver `docs/legal-release-checklist.md`, gerar o lockfile, revisar o SBOM e executar os gates completos.

## Conclusão

O snapshot apresenta uma base de código significativamente expandida, com 27 pacotes e 2 aplicações, verificadores próprios de estrutura/grafo/arquitetura/documentação/higiene e smoke tests focados que passaram. Ainda assim, deve ser tratado como **pré-1.0 e em validação**. Não há evidência suficiente para declarar todos os adapters concluídos, integração total de todas as dependências, conformidade WCAG ou ausência de bugs. O próximo passo correto é instalar e testar a árvore completa em CI e corrigir qualquer defeito encontrado antes de publicar.

## Large benchmark corpus and release archive correction

- Added four deterministic JSONL datasets with 490,000 synthetic records and 264,512,235 bytes total.
- Each individual JSONL dataset is kept below 100,000,000 bytes.
- Dataset contents use only synthetic values; email-shaped values use `example.test`.
- Added JSON Schemas, a deterministic generator, a streaming SHA-256/JSONL verifier and a streaming parse benchmark.
- The archive builder now enforces a ZIP size greater than 100,000,000 bytes and stores benchmark JSONL files without recompression.
- The archive builder streams source files while hashing them; it no longer reads the entire corpus into memory.
- The repository-level archive manifest and its checker also calculate hashes in streams and audit both files and directories.

Commands executed for this correction:

```bash
node scripts/generate-benchmark-fixtures.mjs
node scripts/verify-benchmark-fixtures.mjs
node scripts/benchmark-fixtures.mjs
```

The dataset verification passed for 490,000 records and 264,512,235 bytes. The benchmark measures local JSON parsing throughput only; it is not a browser rendering or accessibility conformance benchmark.



## Entrega ZIP superior a 100 MB

- O requisito de tamanho foi aplicado como condição obrigatória pelo construtor: ZIP estritamente maior que 100.000.000 bytes.
- A entrega gerada possui aproximadamente 265 MB, com tamanho estritamente superior a 100.000.000 bytes.
- O corpus embarcado tem 490.000 registros sintéticos e 264.512.235 bytes em quatro datasets JSONL.
- Todos os quatro datasets foram verificados em streaming; IDs sequenciais, campos, dados JSON, contagens, tamanhos e SHA-256 passaram.
- Os datasets individuais são menores que 100.000.000 bytes.
- O arquivo foi gerado a partir do manifesto, com hashes conferidos durante a cópia, CRC validado e conjunto de membros comparado exatamente.
- O checksum SHA-256 independente do ZIP acompanha a entrega em arquivo `.sha256`.
- O relatório de conteúdo, política de compressão e comandos reproduzíveis está em `docs/release-archive-audit.md`.


## Addendum — mesclagem ZIP + RAR (18 de novembro de 2026)

A tabela de inventário acima descreve o snapshot ZIP-base antes da segunda fonte. Após a mesclagem, a árvore de projeto foi ampliada com o snapshot original do RAR, o arquivo RAR original, índice dos 348 arquivos da fonte ZIP, manifesto de reconciliação, relatório técnico e guia operacional `Dependências.md`. O inventário estrutural atualizado passou a contar 474 arquivos, 27 pacotes e 2 aplicações; 89 documentos Markdown foram inspecionados por `check-docs`.

### Verificações executadas após a mesclagem

- Extração do RAR5 com libarchive: 117 arquivos regulares extraídos; CRC e tamanho dos 117 arquivos conferidos com os metadados do RAR.
- ZIP-base: `ZipFile.testzip()` retornou sem membro inválido.
- Reconciliação: 348 arquivos ZIP, 117 arquivos RAR, 116 caminhos compartilhados, 0 idênticos, 116 divergentes, 1 exclusivo do RAR e 232 exclusivos do ZIP.
- `node scripts/check-source-merge.mjs`: aprovado; hashes do RAR preservado, snapshot e estado ativo conferidos.
- `node scripts/check-packages.mjs`: aprovado para 27 pacotes.
- `node scripts/check-workspace-graph.mjs`: aprovado para 29 projetos, sem ciclos de runtime.
- `node scripts/check-structure.mjs`: aprovado para 27 pacotes, 2 apps, 474 arquivos, 91 JSON, 9 YAML e 38 caminhos críticos.
- `node scripts/check-architecture.mjs`: aprovado; core sem imports de framework/CSS e 48 módulos de runtime verificados.
- `node scripts/check-docs.mjs`: aprovado; 89 arquivos Markdown, links locais válidos.
- `node scripts/check-source-hygiene.mjs`: aprovado; 474 arquivos, sem arquivos vazios, symlinks ou padrões de segredos cobertos pelo scanner.
- `node scripts/verify-benchmark-fixtures.mjs`: aprovado; 490.000 registros e 264.512.235 bytes.
- Testes diretos da CLI Node: 5/5 aprovados.

### Verificações não executadas / bloqueadas

O teste direto de `packages/eslint-plugin/src/index.test.mjs` não iniciou porque o pacote `eslint` não está instalado (`ERR_MODULE_NOT_FOUND`). O ambiente também não tem pnpm nem acesso confirmado ao registry; portanto build Rollup integral, typecheck completo de todos os adapters, Vitest integral, Storybook ePlaywright continuam pendentes. Esses limites não invalidam a reconciliação SHA-256/CRC dos arquivos, mas impedem afirmar que a aplicação toda está sem bugs.
