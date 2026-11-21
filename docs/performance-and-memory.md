# Performance, memória e ciclo de vida

## Princípios

1. **Core importável sem DOM:** nenhum acesso a `window`, `document`, `customElements`, `matchMedia` ou `ResizeObserver` durante importação.
2. **Side effects sob demanda:** listeners, observers, timers, portals e focus traps só são criados ao ativar/abrir/anexar; cada aquisição retorna ou armazena cleanup.
3. **Cleanup idempotente:** desmontagem duplicada não pode lançar, manter listeners nem executar callback tardio.
4. **Sem atualizações globais por padrão:** controllers notificam somente subscribers registrados; adapters devem assinar e cancelar no ciclo de vida próprio.
5. **Sem deep clone de payloads arbitrários:** preservar identidade de objetos do consumidor; snapshots documentam se são cópias rasas ou imutáveis.
6. **Tree-shaking verificável:** subpaths e `sideEffects` devem refletir efeitos reais. Nunca marcar pacote inteiro como livre de efeitos se ele registra polyfills/injeções ao importar.

## Orçamento de bundle

Os números devem ser medidos sobre artefatos de produção minimizados, não estimados por linhas de TypeScript. A política inicial sugerida é medir e publicar os tamanhos gzip/br em cada release:

| Entrada | Meta inicial (gzip) | Condição |
|---|---:|---|
| `@forma-ui/core` root | ≤ 18 KB | alvos de árvore completa com oito componentes originais + primitivos |
| controller individual | ≤ 5 KB | entry point sem estilos/runtime externo |
| `@forma-ui/tokens` | ≤ 8 KB | apenas tokens e conversores |
| adapters sem core duplicado | ≤ 6 KB adicionais | peer dependencies externas |
| `@forma-ui/floating-ui` | declarar peso separado | nunca somar ao bundle core |

Essas metas são hipóteses para medição, não resultados atuais. Ajustar com base em bundles reais e compatibilidade dos consumidores. O CI deve falhar apenas depois de estabelecer baseline confiável e margem para ruído entre versões.

## Virtualização

- O `@forma-ui/virtualization` mantém prefix sums com Fenwick Tree para atualizações/consultas logarítmicas de tamanho.
- A lista é de uma dimensão e gera um range visível com overscan.
- `ResizeObserver` é instalado apenas em `attach()` e removido em `detach()`/`destroy()`.
- `getItemKey` deve produzir identidade estável; índices só são aceitáveis quando a ordem não muda.
- Aplicações devem manter o conteúdo de item semântico e fornecer um modo não virtualizado ou uma estratégia compatível com busca/print/tecnologia assistiva quando o contexto exigir.
- A virtualização não deve remover o item focado sem transferência explícita de foco.

## Overlays

- A pilha de layers deve respeitar topmost layer.
- `autoUpdate` do Floating UI só fica conectado durante a presença do overlay.
- O scroll lock precisa preservar/restaurar estilo inline anterior e compensação de scrollbar.
- O portal deve herdar `dir` e `lang`, sem criar roots globais por componente.

## Temporizadores e notificações

- Cada Toast deve possuir timer cancelável e pausável por hover/foco/documento oculto, conforme a política documentada.
- Callback antigo não deve atualizar store após remoção ou `destroy()`.
- Mensagens assertive devem ser raras; a maioria dos toasts usa polite.

## IDs e SSR

- IDs não podem depender de `Math.random()` ou contador global compartilhado entre requests.
- Um `FormaIdScope` deve ser criado por árvore/request e passado por contexto do adapter quando necessário.
- SSR/hidratação requer o mesmo prefixo/ordem de chamadas no servidor e cliente; diferenças de renderização condicional precisam ser tratadas pelos adapters.

## Observabilidade

- Medir `computePosition`/`autoUpdate`, número de observers/listeners por overlay e tempo de atualização do virtualizer em fixtures dedicadas.
- Não enviar valores de formulário sensíveis, conteúdo de PinInput ou mensagens do usuário em telemetria.
- Performance tests devem registrar browser, SO, viewport, hardware e quantidade de itens; resultados sem contexto não são comparáveis.
