# Forma UI — audit da entrega ZIP superior a 100 MB

## Requisito de tamanho

A entrega é produzida com uma regra rígida no script `scripts/create-source-archive.py`: o processo falha caso o arquivo ZIP tenha tamanho igual ou inferior a 100.000.000 bytes. O ZIP entregue nesta revisão foi criado com **aproximadamente 265 MB**.

## Conteúdo volumoso, porém funcional

O tamanho adicional é composto por datasets sintéticos para testar os caminhos de dados do projeto, e não por padding aleatório ou duplicação de arquivos:

| Dataset | Registros | Bytes | Uso |
|---|---:|---:|---|
| Data Grid — parte 1 | 120.000 | 76.549.542 | Sorting, filtering, seleção, paginação e virtualização |
| Data Grid — parte 2 | 120.000 | 76.549.584 | Mesmos cenários com shard distinto e IDs sequenciais |
| Command Palette | 150.000 | 60.628.341 | Busca, ranking, grupos, atalhos e navegação por teclado |
| Virtualização | 100.000 | 50.784.768 | Alturas variáveis, overscan e medição |
| **Total** | **490.000** | **264.512.235** | Corpus completo de benchmarks |

Os quatro datasets são JSONL determinísticos, com IDs sequenciais e campos verificados. Valores semelhantes a e-mail usam exclusivamente o domínio reservado `example.test`. Os schemas estão em `fixtures/benchmarks/schemas/`; os hashes SHA-256 e contagens ficam em `fixtures/benchmarks/manifest.json`.

Cada arquivo de dataset fica abaixo de 100.000.000 bytes, para não criar blobs individuais acima desse limite em um futuro repositório Git.

## Política de compressão

O conteúdo-fonte, as configurações, os schemas e a documentação são comprimidos com DEFLATE. Os quatro datasets JSONL são armazenados com ZIP STORE, sem compressão. Isso é intencional: JSONL é texto e poderia ser comprimido substancialmente, mas o usuário estabeleceu um requisito explícito de ZIP acima de 100 MB. O conteúdo armazenado é dado de benchmark que pode ser usado após a extração; não são bytes arbitrários. A política também dispensa a etapa de descompressão ao ler os arquivos após extração.

## Validação executada

- `node scripts/verify-benchmark-fixtures.mjs`: passou para todos os 490.000 registros, validando JSON por linha, IDs sequenciais, invariantes dos campos, metadados, schemas, bytes e hashes.
- `node scripts/benchmark-fixtures.mjs`: executado; resultado local guardado em `docs/benchmark-results-node22-linux.json`.
- `node scripts/check-structure.mjs`: passou.
- `node scripts/check-packages.mjs`: passou para 27 pacotes.
- `node scripts/check-workspace-graph.mjs`: passou para 29 projetos, sem ciclos de runtime.
- `node scripts/check-architecture.mjs`: passou; core sem imports de frameworks ou CSS.
- `node scripts/check-docs.mjs`: passou.
- `node scripts/check-source-hygiene.mjs`: passou.
- `node scripts/generate-archive-manifest.mjs` e `node scripts/check-archive-manifest.mjs`: passaram, com hashes SHA-256 em streaming.
- `python scripts/create-source-archive.py ../forma-ui-merged.zip`: passou; checou hashes durante a cópia, CRC, conjunto exato de membros, política STORE e limiar de tamanho.

O build Rollup completo, Vitest integral, Storybook real e testes Playwright de navegador permanecem pendentes porque as dependências não puderam ser instaladas neste ambiente. Consulte `docs/validation-report.md`; não confunda a auditoria do ZIP com a certificação de todas as funcionalidades.

## Reproduzir e conferir

```bash
node scripts/generate-benchmark-fixtures.mjs
node scripts/verify-benchmark-fixtures.mjs
node scripts/benchmark-fixtures.mjs
node scripts/generate-archive-manifest.mjs
node scripts/check-archive-manifest.mjs
python scripts/create-source-archive.py ../forma-ui-merged.zip
sha256sum -c ../forma-ui-merged.zip.sha256
```

O checksum final do ZIP é fornecido em um arquivo `.sha256` ao lado do arquivo compactado. Ele não pode ser incluído dentro do próprio ZIP sem criar uma referência circular: qualquer modificação do ZIP alteraria o checksum.

## Itens deliberadamente não incluídos

`node_modules`, cache pnpm, navegadores Playwright, builds `dist`, caches de ferramentas, cópias de repositórios externos e padding aleatório não fazem parte do pacote. As dependências continuam declaradas nos manifestos e devem ser instaladas com pnpm em uma máquina conectada. Essa separação preserva a rastreabilidade e evita incluir binários específicos de sistema operacional sem necessidade.

## Integração da segunda fonte (RAR)

A esta entrega foi incorporado o arquivo RAR5 `17-01-design-system(1).rar`, preservado byte a byte em `archive-imports/original/17-01-design-system.rar`. Seus 117 arquivos regulares (285.145 bytes descompactados) também foram extraídos para `archive-imports/17-01-design-system/`. Os 116 caminhos em comum com o ZIP tinham conteúdo divergente; nenhum foi sobrescrito automaticamente. O arquivo exclusivo `Dependências.md` foi integrado à raiz como guia operacional atualizado, com o original mantido no snapshot. O inventário `docs/source-merge-manifest.json` registra hashes, tamanhos e relação por arquivo.

O RAR original e seu índice são armazenados com ZIP STORE, sem recompressão, preservando o artefato de proveniência. A árvore ativa continua baseada no ZIP expandido, pois a troca de arquivos de core isolados quebraria contratos diferentes entre máquinas, adapters e exports. A avaliação está em `docs/source-merge-report.md` e `docs/legacy-api-assessment.md`.
