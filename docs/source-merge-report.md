# Relatório de mesclagem das fontes ZIP e RAR

**Status:** mesclagem concluída por preservação e integração seletiva, sem sobrescrita cega de código ativo.

## 1. Fontes auditadas

| Fonte | Tamanho | SHA-256 | Identidade de projeto declarada |
|---|---:|---|---|
| ZIP-base `forma-ui-over-100mb.zip` | 264.940.124 bytes | `fa786a2335345881b220e778d69a89ba35861d71e8606205cae92d0a2be35792` | `forma-ui` 0.3.0 |
| RAR recebido `17-01-design-system(1).rar` | 108.671 bytes | `d64afe3a1820eb368acb0d4d4b9206ebdc3e09a7ffd657bde61a87afbe95ece3` | `17-01-design-system` 1.0.0 |

A versão declarada nos manifestos é apenas metadado; não prova que uma fonte seja cronologicamente mais nova ou compatível com a outra.

## 2. Inventário comparativo

| Medida | ZIP | RAR |
|---|---:|---:|
| Arquivos regulares | 348 | 117 |
| Bytes extraídos dos arquivos regulares | 265.580.109 | 285.145 |
| Entradas incluindo diretórios | 445 | 151 |

Após normalizar os diretórios-raiz (`forma-ui/` no ZIP e `17-01-design-system/` no RAR):

- 116 caminhos existem nas duas fontes.
- 0 dos 116 arquivos em comum têm conteúdo idêntico.
- 116 caminhos têm conteúdo divergente.
- 1 arquivo é exclusivo do RAR: `Dependências.md`.
- 232 arquivos são exclusivos do ZIP.

A diferença em 100% dos caminhos compartilhados demonstra que o RAR é uma implementação divergente, não um patch incremental seguro.

## 3. Política de resolução

1. O conteúdo do ZIP foi escolhido como árvore ativa porque contém o monorepo expandido, 27 pacotes, duas aplicações, ferramentas de engenharia, documentação atual e corpus de benchmarks reproduzíveis.
2. Nenhum arquivo divergente do RAR sobrescreveu um arquivo ativo.
3. Os 117 arquivos regulares extraídos do RAR foram preservados em `archive-imports/17-01-design-system/`, com caminhos relativos e bytes inalterados.
4. O arquivo RAR original foi preservado em `archive-imports/original/17-01-design-system.rar`.
5. O arquivo exclusivo `Dependências.md` foi incorporado à raiz como uma versão operacional atualizada; a cópia original exata continua no snapshot arquivado.
6. A proveniência, os hashes e o relacionamento entre cada arquivo legado e seu possível correspondente ativo estão em `docs/source-merge-manifest.json`.

## 4. Por que não copiar os 116 arquivos divergentes para cima do ZIP?

As APIs e os contratos de distribuição não são equivalentes. Exemplos observáveis no código-fonte:

- O core do RAR usa factories `create*Machine`, snapshots `getState()`, subscriptions e prop-getters detalhados (`getTriggerProps`, `getPanelProps`, etc.).
- O core ativo do ZIP usa controllers/helpers com contratos diferentes (`AccordionController`, `DialogController`, `getButtonProps`, entre outros), além de pacotes funcionais adicionais.
- Os `package.json` não concordam quanto a versão, subpath exports, extensões ESM (`.mjs` versus `.js`) nem scripts de build.
- Os adaptadores React/Vue/Svelte de cada fonte consomem seus respectivos contratos; substituir só o core poderia deixar os adaptadores incompatíveis.

A implementação do RAR continua útil como referência técnica. Ela não foi descartada nem misturada de forma destrutiva: está preservada integralmente para revisão, comparação e portabilidade seletiva em mudanças futuras, acompanhadas de testes e Changesets.

## 5. Pontos valiosos preservados para evolução

- Prop-getters de Accordion e Button com semântica mais expressiva.
- Máquinas com `subscribe()` para adaptação reativa.
- Implementações detalhadas de foco, posicionamento e internacionalização.
- Polyfills de teste para `matchMedia`, `ResizeObserver`, `PointerEvent` e `scrollIntoView`.
- Convenções explícitas de ciclo de vida, RTL e testes por componente.

Esses pontos devem ser comparados caso a caso; os polyfills, por exemplo, não substituem testes reais de navegador e não devem mascarar comportamento ausente.

## 6. Validação realizada

- Listagem do RAR5 concluída sem executar conteúdo do arquivo.
- Caminhos absolutos, `..`, links simbólicos e tipos especiais foram rejeitados pelo extrator.
- 117 arquivos regulares foram extraídos por libarchive.
- Tamanho e CRC de cada arquivo extraído foram comparados com os metadados do RAR: todos passaram.
- O ZIP-base passou `ZipFile.testzip()` sem membro corrompido.
- O manifesto da mesclagem valida hashes do snapshot legado, hash do RAR original, contagens e relações de conflito.

O build integral, Vitest, lint e testes E2E dependem de instalar as dependências do workspace e executar o CI. A integridade da mesclagem não deve ser confundida com aprovação desses testes.

## 7. Próxima estratégia de portabilidade

Qualquer migração de uma máquina legada para a API ativa deve ser feita por componente, com:

1. ADR descrevendo o contrato a portar;
2. implementação adaptada ao modelo ativo;
3. testes unitários de transição, foco, teclado, RTL e cleanup;
4. testes DOM/axe quando aplicáveis;
5. testes de integração nos adapters cobertos;
6. Changeset correspondente;
7. atualização da matriz de cobertura e da documentação.
