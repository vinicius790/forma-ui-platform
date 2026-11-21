# Catálogo funcional dos componentes

Este catálogo define responsabilidades e limites. Os controllers geram props/estado; o consumidor continua responsável por renderizar markup, conteúdo, CSS, mensagens localizadas e integrações de aplicação.

## Componentes de composição e navegação

| Controller | Papel | Interações e contrato principal | Cuidados de implementação |
|---|---|---|---|
| Button | Ação nativa/polimórfica | disabled, loading, type e composição com evento do consumidor | Preferir `<button>` real; não transformar link em button semântica |
| Dialog | Conteúdo modal ou não modal | Escape, outside dismissal, focus trap, restore focus, scroll lock e aria isolation quando modal | `aria-modal` só em modal real; título acessível obrigatório no markup final |
| AlertDialog | Confirmação urgente | Contrato dialog com role alertdialog e ação explícita | Não fechar por outside click por padrão; foco inicial deve apontar para ação segura quando adequado |
| Menu | Comandos de menu | setas, Home/End, typeahead, checkbox/radio items e Escape | Não usar para navegação de links comuns; usar Navigation Menu/Disclosure quando apropriado |
| Tabs | Painéis relacionados | roving tabindex, orientação, RTL, ativação manual/automática | Ativação automática somente quando painel troca sem latência perceptível |
| Tooltip | Informação complementar | hover/focus, delay/warmup, Escape e persistência ao mover ponteiro para tooltip | Nunca receber controles interativos; não ser a única fonte de instrução crítica |
| Select | Escolha de opção | popup/listbox, single/multi conforme variante, typeahead e seleção | Contrato e markup devem distinguir select nativo, listbox e combobox editável |
| Combobox | Entrada + sugestões | valor de texto, active descendant, filtering/async e seleção | Não confundir texto digitado com valor selecionado; anúncio de resultados precisa de estratégia live region |
| Listbox | Lista selecionável | single/multi, foco, typeahead, Home/End e seleção | `aria-selected` e `aria-activedescendant` precisam refletir modelo de foco escolhido |
| TreeView | Hierarquia navegável | expand/collapse, setas, Home/End e seleção | Níveis, `aria-expanded`, posição e contagem de irmãos devem bater com a árvore visível |
| Accordion | Seções expansíveis | expansão, orientação e heading/button semântico | O botão deve estar em heading com nível apropriado no markup |
| Disclosure | Mostrar/ocultar conteúdo | open/close e associação trigger/content | Para navegação simples, usar `<details>` quando a customização não justificar controller |
| Breadcrumb | Localização hierárquica | navegação por links com landmark `navigation` e label | Marcar página atual com `aria-current=page`; não duplicar separadores no nome acessível |
| Pagination | Navegação por páginas | limite de página, anterior/próxima e estado atual | Usar links quando cada página tem URL; botões quando estado local sem navegação |
| Toolbar | Grupo de ações relacionado | roving focus e setas com orientação/direção | Todos os controles devem ter nome acessível e grupo rotulado |
| ToggleGroup | Alternância de opções | single/multiple, setas, home/end e roving focus | Para escolha exclusiva, avaliar RadioGroup se o significado for seleção e não estado pressionado |

## Componentes de formulário e entrada

| Controller | Papel | Interações e contrato principal | Cuidados de implementação |
|---|---|---|---|
| Checkbox | Seleção binária/indeterminada | checked, unchecked, indeterminate, disabled e required | Estado indeterminado exige `aria-checked=mixed`; input nativo é preferível quando possível |
| Switch | Alternância binária | checked, disabled e label | Nome fixo descreve a configuração; não trocar o nome entre ligado/desligado |
| RadioGroup | Escolha única | roving focus, orientação e seleção | Use radio nativo sempre que o design permitir |
| Slider | Valor numérico contínuo/discreto | min/max/step, multi-thumb, teclado, formatação | Cada thumb tem nome; valores precisam seguir bounds e step |
| NumberField | Número discreto | incremento/decremento, min/max/step e locale | Campo vazio não deve ser convertido silenciosamente em zero |
| TextField | Texto simples | disabled/readOnly, descrição e erro | Label programático; não usar placeholder como label |
| SearchField | Consulta | input search, limpar, Enter/Escape e onSearch | Limpar e enviar precisam ser ações distinguíveis |
| PinInput | Código/OTP | colagem, avanço, backspace, máscara e conclusão | Não substituir a proteção do servidor; nunca registrar OTP em analytics/logs |
| RatingGroup | Avaliação | valor e teclado | Rotular escala e valor; oferecer texto acessível, não depender de ícones |
| FormField | Associação de campo | label, hint, erro, required e aria IDREF | Não emitir IDREF para elementos inexistentes; mensagem de erro deve ser textual |

## Feedback e apresentação de dados

| Controller | Papel | Interações e contrato principal | Cuidados de implementação |
|---|---|---|---|
| Toast | Mensagem temporária | store, duração, pausa, remoção e live region | Não esconder erro crítico automaticamente; oferecer duração configurável e pausa acessível |
| Progress | Progresso em curso | min/max/value ou indeterminate | Progress não é Meter; anúncio de atualização deve evitar excesso de fala |
| Meter | Valor de escala fixa | min/max/low/high/optimum | Descrever o que mede e valor textual compreensível |
| Avatar | Identidade visual | estado de imagem loading/loaded/error e fallback | `alt` depende da função/contexto; imagem decorativa não recebe texto repetitivo |
| Separator | Divisão estrutural | horizontal/vertical e semântica separator | Decorativo deve ser ignorado por leitor; não usar role separator para espaçamento sem função |

## Primitivas compartilhadas

| Primitiva | Responsabilidade | Invariantes |
|---|---|---|
| FocusTrap | conter foco em região modal | restaurar foco no fechamento adequado; stack aninhada não solta trap pai |
| DismissableLayer | Escape/clique externo e stack | somente layer superior deve receber dismissal |
| ariaHideOutside | isolar árvore externa | restaurar valores anteriores, inclusive nós aninhados e conteúdo dinâmico |
| Portal | host de renderização | preservar `lang`/`dir`; não mover conteúdo sem estratégia para SSR |
| ScrollLock | bloquear scroll de fundo | preservar estilo original e compensar scrollbar sem layout shift excessivo |
| RovingTabIndex | gerenciar item tab-stop | item desabilitado não se torna foco inicial; direção RTL só espelha eixo horizontal |
| Typeahead | busca por prefixo | normalização Unicode/locale e composição IME sem capturar teclas de edição |
| Positioner | geometria leve | clamping e limites previsíveis; integração Floating UI é opcional |
| State machine | transições puras | transição determinística; efeitos e recursos DOM ficam fora do reducer |
| Collection | identidade/ordem/seleção | chaves únicas, ordem estável e tratamento explícito de itens desabilitados |

## Recursos complementares

- `@forma-ui/dates`: aritmética gregoriana *date-only* e grid de calendário. Não implementa calendário hebraico, islâmico, budista, timezone database, recorrência ou agendamento.
- `@forma-ui/virtualization`: virtualização vertical/horizontal de uma dimensão com estimativa e tamanhos medidos. Não declara suporte a grid/masonry/lanes ou scroll anchoring completo.
- `@forma-ui/motion`: tokens/utilitários para reduced motion; não é uma engine de animação.
- `@forma-ui/ssr`: escopo de IDs determinísticos por request/árvore. A integração precisa ser passada pela aplicação ou adapter; o pacote não tenta adivinhar o runtime SSR.
- `@forma-ui/forms`: engine neutra de formulário e ponte Standard Schema; não substitui bibliotecas completas de formulário ou validação de negócio.
