# Quality gates e política de aceitação

Este documento define o que significa um pacote ou componente estar pronto para integração ou publicação. Criar um arquivo, exportar uma função ou passar em uma compilação isolada não basta.

## Níveis de maturidade

| Nível | Nome | Evidência mínima | O que ainda não significa |
|---|---|---|---|
| 0 | Exploração | API proposta, caso de uso e riscos documentados | Não é implementado |
| 1 | Implementado | Código, contratos, tratamento de erros e cleanup | Não significa integrado |
| 2 | Verificado estaticamente | TypeScript, lint, exports e análise de dependências | Não prova comportamento em browser |
| 3 | Testado em unidade | Casos positivos, negativos, limites e transições | Não prova compatibilidade com framework |
| 4 | Integrado | Testes reais de adapters e DOM; teardown verificado | Não prova todos os navegadores |
| 5 | Browser-tested | Chromium, Firefox e WebKit, teclado/foco e viewport | Não prova conformidade WCAG completa |
| 6 | A11y-reviewed | axe-core, revisão manual, zoom, forced colors e leitores de tela selecionados | Não certifica todas as combinações possíveis |
| 7 | Package-validated | Tarball real, publint, Are The Types Wrong, SemVer e release rehearsed | Não é ainda aprovação de publicação |
| 8 | Release-ready | Gates 0–7, lockfile, SBOM resolvido, security review, provenance e changelog | Não elimina risco residual |

## Requisitos por componente

- Definir papel semântico e justificar quando um elemento nativo HTML não é suficiente.
- Descrever estados, transições, invariantes e callbacks.
- Documentar teclado completo, incluindo RTL e input composition quando aplicável.
- Definir gerenciamento de foco, Escape, clique externo e restauração de foco.
- Definir estratégia de IDs, relações ARIA e nomes acessíveis.
- Tratar disabled, readonly, loading, empty, erro e estados controlados.
- Expor limpeza de timers, observers, listeners, subscriptions e portais.
- Incluir testes de regressão para pelo menos uma falha anterior conhecida.
- Documentar limitações e responsabilidade que fica com o renderer.

## Requisitos por adapter

- Sincronizar props controladas sem resetar estado não controlado durante rerenders.
- Atualizar callbacks sem recriar o controller inadvertidamente.
- Fazer cleanup no ciclo de vida oficial do framework.
- Testar interações via DOM real do framework, não apenas checar tipos.
- Usar fixtures comportamentais comuns quando a interação é equivalente.
- Não declarar paridade em uma linha da matriz sem teste específico e exemplo funcional.

## Requisitos de pacote

- `package.json` com nome, versão, description, exports e allowlist `files` explícita.
- Dependências de runtime mínimas; dependências framework-specific devem ser peer/optional quando apropriado.
- ESM/CJS/declarations só podem ser expostos se os arquivos correspondentes realmente existirem no tarball.
- Script em manifesto deve apontar para um caminho existente.
- README deve conter propósito, instalação, peer dependencies, exemplo, acessibilidade, limites e comandos de teste.
- Testar o `.tgz` efetivo com `publint` e Are The Types Wrong.

## Política de acessibilidade

Automação detecta uma fração dos problemas. Nenhum relatório axe sem violações é certificação WCAG. A revisão manual precisa cobrir pelo menos foco e ordem de teclado, nome/estado, zoom/reflow, contraste/forced-colors, reduced motion e leitor de tela em combinações representativas.

## Política de dependências

- Não adicionar dependências de runtime por conveniência quando uma API nativa é suficiente.
- Manter integrações de build, documentação e teste em pacotes/apps separados.
- Registrar licença, motivo, impacto no bundle, manutenção e alternativa antes de adicionar uma dependência.
- Não incorporar código de referência sem revisão de licença, NOTICE e proveniência.
- Não adicionar binários de browsers, `node_modules`, builds temporários ou conteúdo gerado repetido ao ZIP-fonte.

## Política de release

Publicação é bloqueada enquanto existir qualquer uma das seguintes condições: lockfile ausente, export sem arquivo, tarball inválido, migração sem teste, pacote com README incompleto, teste E2E crítico falhando, workflow sem permissão mínima ou discrepância entre o que README promete e o que o pacote implementa.
