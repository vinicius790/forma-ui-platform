# Design System Headless + Biblioteca de Componentes Acessíveis

> **Documento de visão, especificação funcional e plano técnico do projeto**  
> **Status:** especificação de referência da implementação inicial; repositório Forma UI criado em 17/11/2026; versão 0.1.0 em desenvolvimento e API ainda não estável  
> **Versão deste documento:** 1.0  
> **Última revisão:** 17/11/2026

---

## 1. Resumo executivo

O projeto consiste em criar uma **biblioteca de componentes de interface headless, agnóstica de estilo e orientada por acessibilidade**, distribuída como um conjunto de pacotes versionados. Ela fornecerá a lógica, o comportamento, a semântica, a navegação por teclado, o gerenciamento de foco, os estados e os contratos de composição dos componentes, sem impor uma aparência visual nem obrigar o consumidor a adotar um framework de CSS.

A proposta não é criar mais um kit de componentes visuais, um conjunto de classes utilitárias ou um tema pronto. O produto principal será uma camada confiável de comportamento e acessibilidade que permita a desenvolvedores construir interfaces próprias sem precisar reimplementar, do zero, as partes mais delicadas de cada componente interativo.

A arquitetura pretendida será dividida em camadas:

1. **Fundação e tokens:** convenções, tipos compartilhados, tokens de design e utilitários sem dependência visual obrigatória.
2. **Primitivas comportamentais:** gerenciamento de estado, foco, teclado, navegação entre itens, camadas sobrepostas, portais, IDs e interações com o DOM.
3. **Componentes headless:** componentes compostos por estrutura semântica, comportamento e acessibilidade, sem CSS obrigatório.
4. **Adaptadores de framework:** APIs idiomáticas para React, Vue e Svelte, compartilhando o que for realmente independente de framework.
5. **Camada visual opcional:** temas, receitas de estilo e exemplos visuais que podem ser instalados separadamente.
6. **Documentação e qualidade:** documentação interativa, exemplos reais, testes automatizados e manuais de acessibilidade, CI e releases versionados.

### MVP proposto

A primeira versão funcional deverá entregar oito componentes:

- Button;
- Dialog;
- Menu;
- Tabs;
- Tooltip;
- Select;
- Toast;
- Accordion.

A prioridade do MVP será **correção de comportamento e acessibilidade antes da quantidade de componentes**. Cada componente deverá ter comportamento de teclado definido, semântica coerente, gerenciamento correto de foco quando aplicável, testes de interação e documentação. O pacote inicial deverá ter build modular, tipagens TypeScript e condições reais para publicação em um registry, preferencialmente npm.

### Visão de longo prazo

A versão completa poderá oferecer adaptadores para React, Vue e Svelte; temas plugáveis; tokens em formatos interoperáveis; suporte a internacionalização e RTL; testes de acessibilidade em CI; documentação com playground; changelog e versionamento semântico; guias de migração; e codemods para mudanças de API que possam ser transformadas de maneira segura e previsível.

---

## 2. Interpretação da ideia original

O resumo inicial estabelece cinco decisões fundamentais que devem ser preservadas:

- A biblioteca deve ser **headless**: fornecer comportamento e acessibilidade sem impor CSS.
- A arquitetura deve separar tokens, primitivas comportamentais, componentes, temas e documentação.
- O MVP deve começar com oito componentes específicos, não com uma coleção extensa e superficial.
- A evolução deve considerar temas, i18n/RTL, automação de testes, múltiplos frameworks, SemVer e migrações.
- O diferencial competitivo deve ser a qualidade da camada headless e acessível, e não a aparência de um kit visual.

O projeto ainda está em fase de ideia e estrutura inicial. Portanto, este documento define **o que construir, como organizar a implementação e como validar o resultado**. Ele não afirma que os pacotes, componentes, testes, temas ou pipelines já existam.

### 2.1 Definição em uma frase

Uma plataforma de componentes headless que entrega interações previsíveis, semântica correta e acessibilidade testável, permitindo que cada equipe controle integralmente a aparência e a integração visual de sua interface.

### 2.2 O problema que o projeto pretende resolver

Componentes interativos parecem simples visualmente, mas exigem muitos detalhes para funcionar corretamente. Um menu, por exemplo, não é apenas um painel que aparece ao clicar: ele precisa definir como o foco entra e sai, como as setas navegam, como o Escape fecha, como itens desabilitados se comportam, como o clique externo é tratado e como tecnologias assistivas recebem o estado atual.

Quando cada aplicação implementa essas regras isoladamente, surgem problemas recorrentes:

- comportamento de teclado inconsistente;
- foco perdido ou preso em regiões incorretas;
- uso inadequado de roles e atributos ARIA;
- diferenças de comportamento entre componentes visualmente semelhantes;
- dependência excessiva de bibliotecas visuais;
- dificuldade de mudar de identidade visual sem reimplementar interações;
- testes de acessibilidade tardios ou limitados a verificações superficiais;
- código duplicado para portais, IDs, camadas sobrepostas, navegação e estado.

A biblioteca pretende concentrar essas responsabilidades em uma base reutilizável, documentada e testada.

### 2.3 Proposta de valor

**Para quem desenvolve:** menos lógica de interação repetida, contratos consistentes e APIs composáveis.  
**Para quem projeta:** liberdade para criar uma identidade visual própria sem ficar preso ao estilo da biblioteca.  
**Para quem utiliza a interface:** interações mais previsíveis, semântica melhor e suporte mais consistente a teclado e tecnologias assistivas.  
**Para equipes e organizações:** uma base compartilhada, versionada e com critérios explícitos de qualidade.

---

## 3. Visão, missão e posicionamento

### 3.1 Visão

Ser uma fundação de interface confiável e independente de estilo, utilizada como camada comportamental para produtos digitais que precisam de liberdade visual sem sacrificar acessibilidade, consistência ou qualidade de engenharia.

### 3.2 Missão

Transformar padrões complexos de interação em componentes e primitivas reutilizáveis, com APIs claras, comportamento documentado, testes contínuos e integração simples com diferentes sistemas visuais.

### 3.3 Posicionamento

O produto deverá se posicionar como **infraestrutura de UI**, não como design system visual pronto.

| Categoria | O que normalmente entrega | Relação com este projeto |
|---|---|---|
| Kit visual de componentes | Componentes prontos, com aparência e CSS predefinidos | Não é o foco principal |
| Framework de CSS/utilitários | Ferramentas para construir estilos | Pode ser integrado, mas não substituído |
| Biblioteca headless | Comportamento, semântica, acessibilidade e composição | É o núcleo do projeto |
| Design system completo | Tokens, padrões, componentes, guidelines e governança | Poderá ser oferecido como camada adicional |
| Biblioteca de primitivas | Blocos fundamentais de interação | É parte importante da arquitetura |

### 3.4 Diferenciais que precisam ser demonstráveis

1. **Headless de verdade:** os componentes não devem depender de um tema para funcionar nem injetar aparência visual obrigatória.
2. **Acessibilidade como requisito de engenharia:** teclado, foco, semântica e estados serão definidos antes da camada visual.
3. **Composição:** o consumidor deverá poder controlar a estrutura e a apresentação sem quebrar o comportamento interno.
4. **APIs coerentes:** componentes deverão compartilhar convenções de estado, callbacks, referências, IDs e atributos.
5. **Modularidade:** importar um componente não deverá obrigar o consumidor a carregar a biblioteca inteira.
6. **Documentação verificável:** cada afirmação sobre comportamento deverá estar demonstrada por exemplo e coberta por testes quando possível.
7. **Evolução sustentável:** alterações públicas serão tratadas com versionamento, changelog e migrações documentadas.

---

## 4. Princípios não negociáveis

### 4.1 Headless por padrão

- Não impor paleta, borda, sombra, raio, tamanho, tipografia ou espaçamento aos componentes.
- Não exigir um framework de CSS específico.
- Não adicionar folhas de estilo globais automaticamente.
- Não depender de classes visuais para que a interação funcione.
- Expor estados e atributos suficientes para que a aplicação estilize os diferentes estados.
- Permitir que o consumidor forneça classes, atributos e estilos sem perder handlers ou propriedades essenciais.

Uma implementação headless ainda pode entregar atributos semânticos, estrutura mínima necessária, data attributes de estado e slots/partes para composição. **Headless não significa ausência de semântica, ausência de estrutura ou transferência de toda a lógica ao consumidor.**

### 4.2 Acessibilidade desde o desenho

A acessibilidade deverá orientar a escolha do elemento HTML, o padrão de interação, os estados, a ordem de foco e os testes. A biblioteca deverá consultar o WAI-ARIA Authoring Practices Guide (APG) para padrões aplicáveis e usar WCAG 2.2 nível AA como objetivo de qualidade do produto, sem afirmar conformidade automática apenas porque testes automatizados passaram.

### 4.3 HTML nativo antes de ARIA customizado

Sempre que um elemento HTML nativo resolver o problema corretamente, ele deverá ser preferido a uma implementação customizada com roles e eventos artificiais. ARIA deverá complementar a semântica quando necessário, não substituir controles nativos sem uma razão técnica clara.

### 4.4 Comportamento previsível

- O mesmo tipo de interação deverá seguir convenções consistentes entre componentes.
- Atalhos de teclado não deverão interferir indevidamente na edição de texto ou em atalhos do navegador.
- A abertura e o fechamento de componentes deverão ter regras documentadas.
- Estados desabilitados, somente leitura, carregamento, seleção e erro deverão ser tratados explicitamente quando fizerem parte do componente.

### 4.5 Controle pelo consumidor

Quando fizer sentido, o componente deverá permitir modo controlado e não controlado. O consumidor não deverá ser obrigado a adotar uma store global, um roteador ou um sistema de estado específico.

### 4.6 Progressive enhancement e resiliência

A biblioteca deverá reduzir suposições sobre o ambiente, evitar acesso ao DOM durante importação de módulos e considerar renderização no servidor, hidratação, ambientes de teste e páginas com múltiplas raízes.

### 4.7 Sem dependências desnecessárias

Dependências de runtime deverão ser poucas, justificadas e auditadas. Dependências usadas apenas para desenvolvimento e testes não deverão ser incluídas indevidamente no pacote de produção.

### 4.8 Sem promessas artificiais

Não declarar um componente “100% acessível”, “compatível com todos os leitores de tela” ou “certificado WCAG” sem evidência e escopo de validação adequados. A documentação deverá indicar o que foi testado, em quais ambientes e quais limitações permanecem.

---

## 5. Objetivos, não objetivos e público-alvo

### 5.1 Objetivos do produto

- Fornecer componentes headless para padrões comuns de interface.
- Padronizar regras de foco, teclado, semântica e gerenciamento de estado.
- Permitir composição e estilização próprias.
- Distribuir pacotes TypeScript com tipagens e entradas modulares.
- Manter documentação viva com exemplos executáveis.
- Automatizar testes de comportamento, regressão e acessibilidade.
- Evoluir para vários frameworks sem misturar APIs específicas em um único pacote de runtime.

### 5.2 Não objetivos do MVP

- Criar um tema visual completo.
- Substituir Tailwind CSS, CSS Modules, Sass, CSS-in-JS ou o sistema visual do consumidor.
- Criar componentes de layout genéricos como grid, container, stack e card.
- Oferecer todos os padrões ARIA no primeiro lançamento.
- Implementar todas as variantes de combobox, select, menu e dialog na primeira versão.
- Prometer suporte simultâneo a todos os frameworks antes de provar a arquitetura com uma implementação de referência.
- Criar codemods para toda mudança de API, inclusive quando a transformação não puder ser feita com segurança.

### 5.3 Público-alvo

- Desenvolvedores de bibliotecas e design systems.
- Equipes frontend que possuem identidade visual própria.
- Agências e consultorias que reutilizam componentes em diversos produtos.
- Empresas que precisam de consistência e governança de UI.
- Projetistas e desenvolvedores que priorizam acessibilidade e customização.

### 5.4 Casos de uso prioritários

1. Uma equipe constrói um design system próprio e utiliza os componentes sem adotar estilos predefinidos.
2. Uma aplicação troca de tema sem reescrever a lógica de diálogo, menu, tabs ou seleção.
3. Uma equipe cria uma biblioteca visual sobre os componentes headless.
4. Uma organização padroniza navegação por teclado e gerenciamento de foco em vários produtos.
5. Uma equipe mantém aplicações em frameworks diferentes com convenções comportamentais equivalentes.

---

## 6. Escopo e estratégia de versões

### 6.1 MVP — primeira versão utilizável

O MVP terá os oito componentes do resumo original. A entrega deverá priorizar uma implementação de referência — recomendação inicial: React — e uma camada central que possa ser compartilhada de forma tecnicamente justificável. A decisão de iniciar com React deverá ser registrada como estratégia de redução de risco, não como limitação permanente do produto.

**Entregáveis mínimos do MVP:**

- monorepo ou estrutura equivalente para pacotes;
- configuração TypeScript;
- pacote de primitivas compartilhadas;
- adaptador inicial de framework;
- oito componentes documentados;
- testes de unidade e interação;
- testes automatizados de acessibilidade;
- exemplos de uso e páginas de demonstração;
- build de produção tree-shakeable;
- tipagens publicadas;
- pipeline de CI;
- changelog e versão inicial;
- pacote testado em um projeto consumidor separado.

### 6.2 Versão 1.x — consolidação

- melhorar a API conforme feedback real;
- completar cenários de teclado e tecnologias assistivas;
- aprimorar SSR e hidratação;
- adicionar exemplos mais completos;
- estabilizar convenções de composição;
- incluir temas opcionais sem dependência obrigatória;
- definir matriz oficial de navegadores e frameworks suportados.

### 6.3 Versão 2.x — ecossistema multi-framework

- adaptador Vue;
- adaptador Svelte;
- testes de paridade comportamental entre adaptadores;
- contratos compartilhados de estado e eventos;
- documentação com exemplos equivalentes por framework;
- estratégia formal de compatibilidade entre versões de framework.

### 6.4 Versão avançada

- i18n e RTL mais abrangentes;
- mais componentes e padrões interativos;
- temas plugáveis e pacotes de receitas visuais;
- codemods para migrações determinísticas;
- testes de compatibilidade ampliados;
- política de suporte de longo prazo, quando houver capacidade de manutenção.

---

## 7. Especificação dos oito componentes do MVP

A implementação deverá seguir os padrões adequados ao tipo de widget. Não se deve aplicar o mesmo modelo de teclado a todos os componentes: um botão, um menu e um conjunto de tabs possuem expectativas diferentes.

### 7.1 Button

**Objetivo:** fornecer a base de ações da interface usando, sempre que possível, o elemento HTML `<button>`.

**Escopo inicial:**

- botão de ação padrão;
- variantes semânticas de intenção expostas como estado/atributo ou convenção documentada, sem impor estilo;
- suporte a `type="button"`, `type="submit"` e `type="reset"`;
- estado desabilitado;
- estado de carregamento opcional, sem alterar silenciosamente a semântica da ação;
- suporte a conteúdo textual, ícone e conteúdo composto;
- encaminhamento de referência ao elemento HTML;
- atributos nativos e handlers do consumidor preservados.

**Acessibilidade e comportamento:**

- usar `<button>` em vez de `div role="button"`;
- manter nome acessível discernível;
- funcionar por teclado com comportamento nativo (Enter/Espaço);
- não depender apenas de cor para indicar estado;
- impedir submissão acidental de formulário quando o tipo não for submit;
- quando estiver carregando, comunicar o estado de forma apropriada e evitar ativações duplicadas sem remover indevidamente o controle da ordem de foco.

**Fora do escopo inicial:** botão dividido, grupo avançado de botões e controle de toggle especializado. Esses recursos poderão virar componentes separados.

### 7.2 Dialog

**Objetivo:** exibir conteúdo em uma janela sobre a interface principal, com fluxo de foco controlado.

**Escopo inicial recomendado:** dialog modal. O suporte não modal deverá ser implementado apenas quando os contratos e testes puderem diferenciá-lo com clareza.

**Comportamentos obrigatórios:**

- abrir e fechar por estado controlado ou não controlado;
- abrir por um elemento acionador;
- mover o foco para um ponto inicial adequado dentro do dialog;
- manter a sequência de Tab e Shift+Tab dentro de um modal;
- fechar por Escape, respeitando uma propriedade explícita para bloquear o fechamento quando houver necessidade;
- permitir fechamento por botão visível;
- restaurar o foco ao acionador ao fechar, salvo quando o fluxo indicar um destino lógico diferente;
- impedir interação com o conteúdo externo enquanto modal;
- suportar conteúdo dinâmico sem perder foco;
- tratar múltiplos dialogs e camadas sobrepostas com regras documentadas;
- permitir portal configurável, com destino padrão seguro no cliente.

**Semântica:** `role="dialog"`, `aria-modal="true"` somente quando o bloqueio modal for realmente aplicado, e nome acessível associado a um título visível ou `aria-label`. `aria-describedby` deverá ser opcional e não aplicado indiscriminadamente a conteúdos estruturados extensos.

**Casos de borda:** acionador desmontado antes do fechamento; dialog aberto durante navegação; ausência de elementos focáveis; conteúdo assíncrono; múltiplos dialogs; scroll da página; mudança do destino de portal; escape com composição IME; interação em dispositivos móveis.

### 7.3 Menu

**Objetivo:** fornecer um menu de ações/comandos, normalmente aberto por um botão de menu.

**Distinção importante:** menu ARIA não é sinônimo de qualquer lista suspensa de links. Menus seguem convenções de interação semelhantes às de menus de aplicações desktop. Para navegação comum de um site, uma lista de links dentro de uma estrutura semântica apropriada pode ser mais adequada do que `role="menu"`.

**Escopo inicial recomendado:** menu simples acionado por botão, com itens de ação. Submenus, menus de contexto, menubar persistente e itens checkbox/radio poderão ser fases posteriores.

**Comportamentos obrigatórios:**

- abrir por acionamento do botão;
- expor estado expandido no acionador;
- colocar foco no primeiro item habilitado ao abrir;
- permitir navegação por setas;
- oferecer Home e End;
- suportar typeahead para localizar itens pelo início do texto;
- fechar com Escape e devolver foco ao acionador;
- fechar após ativação de um item quando apropriado;
- tratar clique/toque externo;
- ignorar ativação de itens desabilitados;
- permitir orientação e direção de leitura quando isso fizer parte do contrato.

**Semântica:** aplicar roles de menu e menuitem somente para o padrão de menu de ações. Não converter links de navegação do site em menu ARIA sem necessidade.

**Casos de borda:** lista vazia; todos os itens desabilitados; itens adicionados/removidos dinamicamente; conteúdo dentro de portal; cliques dentro do menu; menu aberto perto das bordas da viewport; letras repetidas no typeahead; layouts RTL.

### 7.4 Tabs

**Objetivo:** alternar entre painéis relacionados, exibindo um painel por vez.

**Comportamentos obrigatórios:**

- estado controlado e não controlado;
- um tab selecionado inicialmente, quando aplicável;
- navegação por setas conforme orientação horizontal/vertical;
- Home e End;
- relação entre tab e tabpanel por IDs estáveis;
- distinção entre foco e seleção quando o modo de ativação for manual;
- opção de ativação automática quando os painéis puderem ser exibidos sem atraso perceptível;
- tratamento de tabs desabilitadas;
- painel com possibilidade de receber foco quando não contiver um destino focável adequado.

**Decisão do MVP:** oferecer ativação automática como padrão apenas se os painéis estiverem pré-carregados e a troca for imediata. Caso contrário, ativação manual deverá estar disponível e documentada. A implementação não deve causar atraso perceptível ao percorrer tabs com setas.

**Casos de borda:** tab ativa removida; tab desabilitada; lista dinâmica; orientação vertical; direção RTL; painel assíncrono; IDs duplicados por múltiplas instâncias.

### 7.5 Tooltip

**Objetivo:** apresentar informação complementar breve associada a um elemento, acionada por foco do teclado ou hover do ponteiro.

**Limite fundamental:** tooltip não deve conter botões, links ou controles que recebam foco. Quando o conteúdo precisar de interação, usar um popover ou dialog não modal, e não ampliar artificialmente o tooltip.

**Comportamentos obrigatórios:**

- abrir ao receber foco pelo teclado;
- abrir ao passar o ponteiro após atraso configurável e razoável;
- permanecer visível enquanto o foco ou ponteiro estiver em condição válida;
- fechar ao perder foco/ponteiro conforme as regras documentadas;
- fechar com Escape;
- associar o acionador ao tooltip por `aria-describedby`;
- não mover o foco para o tooltip;
- permitir desativar ou ajustar atraso sem prejudicar navegação por teclado.

**Limitações documentadas:** o padrão de tooltip do APG está identificado como trabalho em andamento. A implementação deverá acompanhar a orientação atual, validar combinações reais de navegador/leitor de tela e não vender o padrão como universalmente resolvido.

### 7.6 Select

**Objetivo:** permitir escolher uma opção de uma lista de valores.

**Delimitação obrigatória do MVP:** começar com um **select de seleção única e não editável (select-only combobox)**. Filtragem, autocomplete, seleção múltipla, agrupamentos complexos e virtualização deverão ficar fora do primeiro escopo.

**Comportamentos esperados:**

- valor controlado ou não controlado;
- opção inicial e placeholder claramente diferenciados;
- abrir por clique/toque e teclado;
- navegação entre opções;
- seleção por Enter/Espaço conforme o padrão adotado;
- Escape fecha sem substituir o valor previamente confirmado;
- fechamento por seleção, Tab e interação externa conforme contrato;
- opções desabilitadas não podem ser selecionadas;
- typeahead para opções cujo texto corresponda ao padrão;
- rolagem automática para a opção ativa;
- suporte a rótulo acessível, descrição e estado inválido;
- associação correta entre o controle e o popup;
- suporte a formulário deverá ser definido explicitamente (incluindo estratégia de valor submetido).

**Decisão técnica crítica:** comparar a necessidade de um componente customizado com a opção de encapsular um `<select>` nativo. O componente customizado só deverá ser adotado se fornecer valor claro de composição/controle e se a matriz de navegador, teclado e tecnologias assistivas puder ser testada. A existência de um exemplo no APG não substitui testes de produção; o próprio APG alerta para lacunas de suporte em combinações de browser/AT.

**Fora do MVP:** autocomplete editável, busca remota, multiselect, tags, listbox virtualizado e popups complexos.

### 7.7 Toast

**Objetivo:** comunicar brevemente um evento sem interromper o fluxo principal.

**Escopo inicial:** mensagens de status e alerta não modal, com API de criação/remoção, região de anúncio e possibilidade de dispensa manual.

**Comportamentos obrigatórios:**

- API para adicionar, remover e limpar notificações;
- identificador estável por notificação;
- texto acessível e prioridade de anúncio bem definida;
- possibilidade de dispensar manualmente;
- duração configurável, incluindo persistência sem timeout;
- pausar ou prolongar o timeout durante hover/foco quando aplicável;
- não retirar uma mensagem enquanto o usuário interage com ela;
- limitar ou agrupar notificações para não inundar tecnologias assistivas;
- comportamento claro para notificações repetidas;
- ações opcionais somente quando sua interação e tempo de permanência forem acessíveis.

**Semântica:** escolher `status`/`polite` ou `alert`/`assertive` conforme urgência e interrupção necessárias. Não utilizar `alert` para toda mensagem, pois isso pode interromper excessivamente a leitura.

**Casos de borda:** muitas notificações simultâneas; mensagens idênticas; timeout durante foco; navegação entre páginas; SSR; atualização do texto da mesma notificação; ações internas; redução de movimento.

### 7.8 Accordion

**Objetivo:** organizar conteúdo expansível em seções.

**Comportamentos obrigatórios:**

- expandir/recolher uma seção;
- suportar modo independente (várias seções abertas) e, opcionalmente, modo exclusivo (uma aberta por vez);
- permitir estado controlado ou não controlado;
- indicar estado expandido no acionador;
- associar o botão ao painel correspondente;
- manter o foco no acionador ao abrir/fechar;
- permitir configurar se a última seção aberta pode ser recolhida no modo exclusivo;
- suportar seções desabilitadas;
- preservar conteúdo ou desmontá-lo conforme uma opção documentada, sem alterar inesperadamente estado de formulários internos.

**Semântica:** título de seção com botão como elemento interativo; não criar headings artificiais nem níveis de título incoerentes. O nível de heading deverá ser configurável ou composto pelo consumidor conforme a hierarquia da página.

**Casos de borda:** painel com formulário; conteúdo assíncrono; seções removidas dinamicamente; estado inicial; múltiplas instâncias; nested accordions.

---

## 8. Primitivas compartilhadas

Os componentes não deverão implementar isoladamente cada detalhe de baixo nível. A equipe deverá identificar comportamentos compartilháveis e criar primitivas pequenas, testáveis e com APIs estáveis.

| Primitiva | Responsabilidade | Cuidados |
|---|---|---|
| Estado controlado/não controlado | Unificar `value/defaultValue`, `open/defaultOpen` e callbacks | Evitar callbacks duplicados e mudanças inesperadas de estado |
| IDs acessíveis | Gerar IDs únicos e estáveis por instância | SSR, hidratação, múltiplas raízes e renderização concorrente |
| Focus scope | Definir região de foco, contenção e restauração | Nested dialogs, elementos removidos e Shadow DOM quando suportado |
| Roving focus | Gerenciar foco entre itens de widgets compostos | Itens desabilitados, orientação e RTL |
| Typeahead | Localizar itens por texto digitado | Acentos, Unicode, repetição de letras e IME |
| Dismissable layer | Fechar camadas por Escape e interação externa | Camadas aninhadas e eventos em portais |
| Portal | Renderizar fora da árvore visual local | SSR, destino customizado e ciclo de vida |
| Collection | Manter registro ordenado de itens | Atualizações dinâmicas e chaves estáveis |
| Direção e idioma | Expor direção LTR/RTL e localidade | Não presumir idioma global nem substituir recursos do app |
| Presence | Coordenar montagem/desmontagem com animações opcionais | Respeitar `prefers-reduced-motion` e não atrasar acessibilidade |
| Form integration | Integrar controles a formulários | Nome, valor, required, disabled, reset e validação nativa |

### 8.1 Critério para extrair uma primitiva

Uma abstração só deverá ser criada quando:

- houver mais de um caso real de uso ou uma complexidade que justifique isolamento;
- o contrato puder ser descrito sem conhecer a aparência do componente;
- os testes puderem validar o comportamento isoladamente;
- a abstração reduzir duplicação sem esconder diferenças legítimas entre padrões.

Não criar um framework interno excessivo antes de implementar e testar os primeiros componentes.

---

## 9. Arquitetura técnica proposta

### 9.1 Visão em camadas

```text
Aplicação consumidora
        │
        ├── CSS / CSS Modules / Tailwind / CSS-in-JS / estilos próprios
        │
        ▼
Componentes headless do framework
(React / Vue / Svelte)
        │
        ▼
Contratos e primitivas compartilhadas
(estado, foco, teclado, coleções, camadas, IDs)
        │
        ├── Tokens de design opcionais
        ├── Temas e receitas visuais opcionais
        └── Utilitários de teste e documentação
```

O consumidor deverá poder importar componentes headless sem instalar os temas. Da mesma forma, um tema deverá poder depender dos componentes e tokens sem se tornar obrigatório para a camada central.

### 9.2 Arquitetura multi-framework: decisão recomendada

O projeto pretende alcançar React, Vue e Svelte. Isso não significa que um componente escrito uma vez em React possa funcionar automaticamente nos outros frameworks.

**Estratégia recomendada:**

- compartilhar algoritmos e contratos realmente independentes de framework;
- manter adaptadores próprios para ciclo de vida, reatividade, refs, eventos, slots e renderização em cada framework;
- preservar a API idiomática de cada framework, dentro de uma semântica de comportamento equivalente;
- não obrigar Vue e Svelte a imitar a API de React;
- documentar diferenças inevitáveis e testar paridade de comportamento.

Exemplo: a regra de navegação por setas pode ser compartilhada como algoritmo; a forma de conectar essa regra à reatividade, ao ciclo de vida e ao DOM será específica do adaptador.

### 9.3 Organização de pacotes sugerida

Os nomes abaixo são ilustrativos. O escopo definitivo da marca ainda deverá ser escolhido.

| Pacote | Responsabilidade |
|---|---|
| `@SCOPE/core` | Contratos, tipos e utilitários framework-agnostic |
| `@SCOPE/react` | Componentes e adaptadores React |
| `@SCOPE/vue` | Componentes e composables Vue |
| `@SCOPE/svelte` | Componentes e actions/utilitários Svelte |
| `@SCOPE/tokens` | Tokens em formatos interoperáveis |
| `@SCOPE/themes` | Temas visuais opcionais |
| `@SCOPE/testing` | Utilitários de teste públicos, se necessário |

A nomenclatura real deverá ser definida antes da publicação. Evitar publicar pacotes vazios ou dividir artificialmente a biblioteca em dezenas de pacotes antes de comprovar a necessidade.

### 9.4 Estrutura de diretórios sugerida

```text
project-root/
├── apps/
│   ├── docs/
│   └── playground/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   └── tests/
│   ├── react/
│   │   ├── src/
│   │   │   ├── button/
│   │   │   ├── dialog/
│   │   │   ├── menu/
│   │   │   ├── tabs/
│   │   │   ├── tooltip/
│   │   │   ├── select/
│   │   │   ├── toast/
│   │   │   └── accordion/
│   │   └── tests/
│   ├── tokens/
│   └── themes/
├── tooling/
│   ├── eslint/
│   ├── typescript/
│   └── test-config/
├── .github/
│   └── workflows/
├── changeset-config/          # ou configuração do Changesets na raiz
├── package.json
├── tsconfig.base.json
├── pnpm-workspace.yaml         # se pnpm for adotado
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

Esta estrutura é uma proposta inicial, não uma exigência. O importante é manter limites claros entre runtime, adaptadores, temas, documentação e ferramentas.

### 9.5 TypeScript e contratos

- `strict` habilitado;
- tipos públicos explícitos e documentados;
- evitar `any` em contratos exportados;
- generics apenas quando realmente agregarem segurança de tipos;
- tipagens publicadas junto ao pacote;
- validar compatibilidade entre declarações geradas e JavaScript distribuído;
- não expor detalhes internos que impeçam refatorações futuras.

### 9.6 Política de dependências

**Dependências de runtime:** manter mínimas.  
**Dependências peer:** frameworks e bibliotecas que devem ser fornecidos pela aplicação, conforme pacote.  
**Dependências de desenvolvimento:** ferramentas de build, lint, testes, documentação e geração de tipos.

Cada dependência nova deverá registrar: problema que resolve, impacto no bundle, licença, manutenção, segurança, compatibilidade e possibilidade de substituição por uma implementação menor.

---

## 10. Tokens, temas e camada visual opcional

### 10.1 Tokens não são estilos impostos

O projeto deverá separar a definição de valores de design da aplicação desses valores nos componentes.

Exemplos de categorias de tokens:

- cores primitivas e semânticas;
- espaçamento;
- tipografia;
- raios;
- bordas;
- sombras;
- camadas/z-index;
- motion/duração/easing;
- breakpoints, quando necessário;
- foco e indicadores de interação.

O pacote de tokens poderá exportar JSON, TypeScript e/ou CSS custom properties. A escolha final deverá considerar interoperabilidade e manutenção. Importar tokens não deverá ser requisito para utilizar componentes headless.

### 10.2 Tokens primitivos e semânticos

- **Primitivos:** valores-base, como escalas de cinza, unidades e escalas tipográficas.
- **Semânticos:** significado de uso, como `surface`, `text`, `border`, `focus-ring`, `danger` e `success`.

A camada de temas deverá mapear tokens semânticos para valores concretos. O componente headless não deverá depender de uma cor específica para identificar visualmente seu estado.

### 10.3 Temas

A camada visual poderá incluir temas de referência, por exemplo:

- claro;
- escuro;
- alto contraste;
- tema de demonstração;
- temas customizados fornecidos pela aplicação.

Os temas deverão ser opcionais, substituíveis e não interferir na semântica ou nos handlers dos componentes.

### 10.4 Estados visuais que precisam ser expostos

Os componentes deverão permitir estilização consistente de estados como:

- `data-state="open|closed"`;
- `data-disabled`;
- `data-selected`;
- `data-highlighted` ou estado equivalente;
- `data-orientation="horizontal|vertical"`;
- estado de carregamento;
- estado inválido;
- foco visível.

Os nomes definitivos devem ser padronizados e documentados. Atributos de estado não devem substituir atributos ARIA exigidos pelo padrão.

---

## 11. Convenções de API e composição

### 11.1 Estado controlado e não controlado

Para estados relevantes, adotar uma convenção consistente:

- `open` + `defaultOpen` + `onOpenChange`;
- `value` + `defaultValue` + `onValueChange`;
- `selectedValue` + `defaultSelectedValue` somente quando a distinção semântica justificar esses nomes.

O componente deverá detectar e documentar o modo utilizado, evitando alternar silenciosamente entre controlado e não controlado durante o ciclo de vida.

### 11.2 Convenções gerais

- nomes de props previsíveis;
- eventos com payloads documentados;
- referências ao elemento DOM disponíveis quando fizerem sentido;
- atributos HTML válidos encaminhados corretamente;
- handlers do consumidor preservados;
- IDs acessíveis gerados internamente quando não fornecidos;
- slots/children para conteúdo composto;
- estados expostos sem depender de CSS específico;
- erros de uso detectáveis em desenvolvimento quando possível.

### 11.3 Composição em componentes complexos

Para Dialog, Menu, Tabs, Select, Toast e Accordion, considerar uma API composta (`Root`, `Trigger`, `Content`, `Item`, `Panel`, etc.) quando isso facilitar flexibilidade estrutural e acessibilidade.

A composição deverá ter documentação que esclareça:

- quais partes são obrigatórias;
- quais elementos HTML são gerados;
- quais atributos são adicionados;
- onde a referência DOM é encaminhada;
- como slots/children interagem com o componente;
- como o foco é administrado;
- quais atributos podem ser substituídos pelo consumidor e quais não devem ser removidos.

Evitar uma API polimórfica excessivamente mágica antes de provar que ela resolve um problema real. Recursos como `asChild`, clones de elementos e mesclagem automática de handlers exigem testes rigorosos para não quebrar refs, eventos ou semântica.

### 11.4 Exemplo conceitual

O exemplo abaixo é **ilustrativo**, não um contrato final de API:

```tsx
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger className="meu-gatilho">
    Abrir detalhes
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay className="minha-sobreposicao" />
    <Dialog.Content className="meu-dialog">
      <Dialog.Title>Detalhes</Dialog.Title>
      <Dialog.Description>
        Informações complementares.
      </Dialog.Description>
      <Dialog.Close>Fechar</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

A aplicação controla a aparência; a biblioteca administra a interação e a semântica.

---

## 12. Acessibilidade: critérios e estratégia de validação

### 12.1 Referências normativas e práticas

O projeto deverá acompanhar principalmente:

- **WCAG 2.2:** critérios de sucesso aplicáveis, com objetivo de qualidade equivalente ao nível AA;
- **WAI-ARIA 1.2 e APG:** roles, estados, propriedades e padrões de interação;
- **HTML Living Standard:** semântica e comportamento dos elementos nativos;
- **documentação de navegadores e tecnologias assistivas:** suporte real e limitações de implementação.

O APG é uma referência de padrões, exemplos e interação por teclado. Não deve ser tratado como uma certificação nem como garantia de que uma implementação demonstrativa funcionará sem adaptações em todos os ambientes.

### 12.2 Requisitos transversais

Cada componente deverá ser avaliado quanto a:

- operação por teclado;
- ausência de armadilha de teclado;
- ordem lógica de foco;
- indicador de foco perceptível;
- nome, papel e valor acessíveis;
- estados comunicados por tecnologias assistivas;
- contraste e estados visuais quando houver tema;
- ampliação e reflow;
- alvos de interação e uso por toque;
- comportamento em alto contraste/forced colors;
- redução de movimento;
- idioma e direção do texto;
- atualizações dinâmicas anunciadas sem excesso;
- zoom, scroll e conteúdo oculto.

### 12.3 Testes automatizados

Utilizar `axe-core` integrado a testes de componente e/ou navegador para detectar problemas comuns. O pipeline deverá falhar diante de violações definidas como bloqueadoras, com exceções documentadas, justificadas e acompanhadas de prazo de correção.

Automação não consegue validar integralmente usabilidade por teclado, qualidade do foco, clareza dos anúncios ou compatibilidade de leitores de tela. Por isso, ela será apenas uma camada do processo.

### 12.4 Testes manuais

Criar roteiros repetíveis para:

- teclado sem mouse;
- leitor de tela em combinações selecionadas de sistema e navegador;
- zoom do navegador;
- alto contraste/forced colors;
- viewport pequena e uso por toque;
- navegação com conteúdo dinâmico;
- fluxo de foco após abrir, fechar e remover elementos.

A matriz de suporte deverá ser publicada na documentação e revista a cada ciclo relevante de release.

### 12.5 Critério de aprovação

Um componente só poderá ser considerado pronto quando:

1. os padrões de interação e as decisões semânticas estiverem documentados;
2. todos os cenários obrigatórios de teclado tiverem testes;
3. não houver violações automatizadas bloqueadoras sem justificativa formal;
4. os testes manuais definidos para o componente tiverem sido executados;
5. os casos de borda relevantes estiverem cobertos;
6. as limitações conhecidas estiverem registradas.

---

## 13. Estratégia de testes e qualidade

### 13.1 Pirâmide de testes

| Camada | Objetivo | Ferramentas candidatas |
|---|---|---|
| Testes unitários | Validar algoritmos, estado e utilitários | Vitest ou runner equivalente |
| Testes de interação | Validar ações de usuário e semântica DOM | Testing Library |
| Testes de acessibilidade | Detectar violações comuns | axe-core |
| Testes de navegador | Validar foco, portais, eventos e fluxos reais | Playwright ou equivalente |
| Testes de contrato | Garantir consistência entre adaptadores | Suíte compartilhada de cenários |
| Testes de pacote | Confirmar exports, tipos e instalação | `npm pack`, projeto consumidor e verificação de tipos |
| Testes de regressão | Detectar mudança comportamental involuntária | Fixtures e cenários versionados |

As ferramentas indicadas são candidatas coerentes com o resumo original; as versões deverão ser fixadas e atualizadas de forma controlada quando a implementação começar.

### 13.2 Matriz mínima por componente

Todos os componentes deverão ter casos para:

- renderização inicial;
- uso com e sem controle externo de estado;
- teclado;
- mouse e toque;
- estado desabilitado;
- conteúdo dinâmico;
- acessibilidade automatizada;
- múltiplas instâncias;
- montagem/desmontagem;
- ambiente SSR, quando aplicável.

### 13.3 Contratos comuns de interação

A equipe deverá manter cenários de teste compartilhados para validar, entre adaptadores:

- valor inicial;
- evento de alteração;
- Escape e fechamento;
- navegação por teclado;
- foco inicial e restauração;
- itens desabilitados;
- IDs e relações ARIA;
- atualizações externas de estado.

Os testes não devem forçar diferenças internas desnecessárias entre frameworks, mas também não devem apagar diferenças idiomáticas legítimas.

### 13.4 Qualidade estática

- lint;
- formatação;
- typecheck;
- detecção de imports circulares;
- verificação de exports;
- cobertura mínima definida após baseline real;
- análise de dependências e licenças;
- auditoria de vulnerabilidades;
- verificação de arquivos publicados.

A cobertura percentual não deve ser tratada como métrica única de qualidade. Testes de foco e teclado precisam validar resultados observáveis, não apenas executar linhas de código.

---

## 14. Build, distribuição e tree-shaking

### 14.1 Requisitos de distribuição

- pacote ESM como formato de referência;
- arquivos de declaração TypeScript;
- `package.json` com `exports` explícitos;
- subpaths de importação por componente quando fizer sentido;
- sourcemaps adequados;
- peer dependencies corretamente declaradas;
- arquivos de desenvolvimento excluídos do pacote final;
- build reproduzível;
- verificação com instalação real a partir do tarball gerado.

A distribuição CommonJS deverá ser adicionada somente se houver requisito de consumidores que a justifique. Publicar vários formatos sem necessidade cria combinações extras de manutenção e pode introduzir problemas de interoperabilidade.

### 14.2 Rollup e esbuild

O resumo original cita Rollup/esbuild. A recomendação inicial é escolher uma ferramenta principal após um protótipo de build, em vez de manter duas pipelines redundantes.

- **Rollup:** opção adequada para controlar entradas, saídas, formatos e tree-shaking de bibliotecas.
- **esbuild:** opção rápida para transformação e bundling, com suporte a eliminação de código não utilizado.
- **TypeScript:** usar `tsc` ou ferramenta compatível para verificar tipos e emitir declarações; não presumir que o bundler, por si só, produz todos os tipos necessários.

A escolha final deverá ser validada com os pacotes reais, os subpaths, o output ESM, as tipagens e o comportamento em projetos consumidores.

### 14.3 Tree-shaking real

Para cumprir a promessa de modularidade:

- evitar imports globais de todos os componentes;
- evitar inicialização com efeitos colaterais no topo de módulos;
- fornecer entradas independentes;
- declarar `sideEffects` apenas se isso for verdadeiro para todos os arquivos cobertos;
- testar consumo de um componente isolado;
- analisar o bundle de uma aplicação de demonstração;
- manter relatório de tamanho por entrada.

Não basta marcar uma configuração como tree-shakeable. O pacote deve ser validado no bundler do consumidor.

### 14.4 Política de tamanho

No início, medir o tamanho real dos pacotes e componentes. Depois de existir baseline confiável, definir limites de regressão para:

- módulo de componente;
- conjunto de primitivas compartilhadas;
- temas opcionais;
- pacote completo.

Não fixar números arbitrários antes de implementar e medir a primeira versão.

---

## 15. Documentação viva e experiência de desenvolvimento

A documentação deverá ser tratada como parte do produto, não como complemento final.

### 15.1 Estrutura recomendada

1. Visão geral e filosofia headless.
2. Instalação por framework.
3. Guia de composição.
4. Fundamentos de acessibilidade.
5. Tokens e temas opcionais.
6. Documentação de cada componente.
7. Referência completa de props, eventos e tipos.
8. Exemplos práticos.
9. SSR e hidratação.
10. Integração com formulários.
11. Internacionalização e RTL.
12. Testes e validação de acessibilidade.
13. Migração entre versões.
14. Changelog e política de suporte.

### 15.2 Página de cada componente

Toda página de componente deverá conter:

- para que serve;
- quando usar e quando não usar;
- instalação/import;
- exemplo mínimo;
- exemplo composto;
- anatomia e partes disponíveis;
- tabela de propriedades, eventos e tipos;
- comportamento controlado e não controlado;
- teclado suportado;
- semântica e atributos ARIA;
- estados e data attributes;
- personalização sem CSS imposto;
- casos de borda;
- limitações conhecidas;
- exemplos de testes;
- estado de maturidade do componente.

### 15.3 Playground

O playground deverá permitir alterar o código e observar comportamento, estados, semântica e diferentes estilos. A documentação poderá oferecer alternância de framework depois que os adaptadores existirem.

### 15.4 Exemplos de estilo

Exibir pelo menos três abordagens:

- CSS simples/CSS Modules;
- Tailwind ou utilitários equivalentes;
- tokens/tema opcional do próprio projeto.

O objetivo é demonstrar que a biblioteca não depende de uma dessas opções.

---

## 16. Internacionalização e RTL

O suporte a i18n/RTL deve ser preparado desde a arquitetura, mesmo que não seja uma entrega completa do MVP.

### 16.1 Requisitos

- não embutir mensagens de interface em um idioma específico;
- permitir que textos padrão sejam fornecidos pelo consumidor;
- aceitar strings Unicode;
- evitar lógica baseada apenas em letras ASCII;
- considerar `dir="rtl"` e orientação de leitura;
- separar direção visual de ordem de dados;
- oferecer posicionamento e navegação compatíveis com RTL;
- não presumir locale global;
- documentar regras de pluralização e formatação quando aplicáveis.

### 16.2 Typeahead e Unicode

Busca por caractere deverá levar em conta normalização Unicode, acentos, caracteres compostos e sequências digitadas. O algoritmo não deve limitar-se a `toLowerCase()` e comparação de uma unidade ASCII.

### 16.3 Direção de teclado

Para componentes com orientação horizontal, a equipe deverá definir e testar o efeito de setas em LTR e RTL, preservando expectativas do padrão escolhido e evitando inversões arbitrárias.

---

## 17. SSR, hidratação e compatibilidade

A biblioteca deverá funcionar em aplicações que renderizam HTML no servidor e hidratam no cliente, respeitando as limitações de cada framework.

Requisitos:

- não acessar `window`, `document` ou `HTMLElement` durante importação do módulo;
- executar lógica dependente do DOM em momento seguro do ciclo de vida;
- gerar IDs determinísticos e únicos no contexto de renderização;
- evitar diferenças entre HTML do servidor e cliente;
- não criar portais antes de existir ambiente DOM;
- documentar o comportamento em ambientes de teste sem navegador;
- testar hidratação com dialogs, menus, tooltips e toasts;
- definir comportamento quando o destino de portal não estiver disponível.

A compatibilidade não deverá ser anunciada de forma genérica. Publicar uma matriz por framework, versão suportada, ambiente de build e funcionalidades testadas.

---

## 18. Performance e experiência do consumidor

A performance deverá ser medida sem sacrificar acessibilidade ou previsibilidade.

### 18.1 Requisitos

- nenhum CSS obrigatório;
- dependências de runtime reduzidas;
- imports modulares;
- listeners adicionados apenas quando necessários;
- remoção correta de listeners e subscriptions;
- evitar observers e timers desnecessários;
- renderizações controladas;
- sem trabalho pesado em eventos frequentes;
- evitar medições síncronas repetidas do layout;
- suportar listas razoáveis de opções sem degradação perceptível.

### 18.2 Métricas a coletar

- tamanho gzip e brotli por pacote/entrada;
- tempo de build;
- tempo de montagem e interação de casos representativos;
- número de dependências de runtime;
- regressões de renderização nos componentes com listas.

Definir metas numéricas somente depois de obter medições iniciais representativas.

---

## 19. Segurança, supply chain e publicação

Embora seja uma biblioteca de UI, o processo de publicação precisa proteger a integridade dos pacotes.

Requisitos recomendados:

- revisão de dependências e permissões;
- CI executado em branches e tags apropriadas;
- release automatizado com controle de versão;
- publicação por identidade OIDC/trusted publishing quando suportada pelo registry e pelo provedor de CI;
- evitar tokens de publicação de longa duração quando houver alternativa segura;
- geração de provenance quando disponível;
- proteger branches e tags de release;
- não executar scripts desnecessários durante instalação;
- manter `SECURITY.md` com canal de reporte;
- registrar procedimento de resposta a vulnerabilidades.

A configuração real de trusted publishing depende das versões de Node/npm e do provedor de CI disponíveis no momento da implantação. Deve ser verificada antes de ser adotada.

---

## 20. Versionamento, changelog e migrações

### 20.1 SemVer

Adotar versionamento semântico:

- **MAJOR:** alterações incompatíveis na API pública;
- **MINOR:** funcionalidades compatíveis;
- **PATCH:** correções compatíveis.

Mudanças de comportamento que afetem fluxo de teclado, estado ou semântica devem ser tratadas com o mesmo cuidado de uma mudança de API, ainda que a assinatura TypeScript permaneça igual.

### 20.2 Changelog

Cada release deverá documentar:

- novos componentes/recursos;
- correções;
- alterações de acessibilidade;
- mudanças de comportamento;
- depreciações;
- breaking changes;
- instruções de migração;
- compatibilidade de frameworks e dependências.

### 20.3 Codemods

Codemods serão criados apenas quando a mudança puder ser detectada e transformada com segurança, por exemplo, renomeação explícita de prop em sintaxe conhecida.

Cada codemod deverá:

- ser versionado;
- ter testes com casos válidos e inválidos;
- preservar comentários e formatação sempre que possível;
- oferecer modo de pré-visualização;
- informar alterações que não pôde realizar;
- nunca afirmar que concluiu migrações ambíguas.

Quando a alteração exigir decisão de produto ou interpretação semântica, fornecer guia manual em vez de uma transformação arriscada.

---

## 21. CI/CD e processo de release

### 21.1 Pipeline de pull request

1. instalar dependências com lockfile;
2. lint e formatação;
3. typecheck;
4. testes unitários;
5. testes de interação;
6. testes de acessibilidade automatizados;
7. testes de navegador essenciais;
8. build;
9. verificação de exports e tipagens;
10. empacotar e instalar em aplicação de teste;
11. relatório de tamanho;
12. verificação de dependências e segurança.

### 21.2 Pipeline de release

1. validar changelog;
2. validar versão e dependências entre pacotes;
3. gerar artefatos;
4. executar testes finais;
5. publicar pacote(s);
6. gerar release notes;
7. publicar tag e release no GitHub;
8. confirmar instalação da versão publicada;
9. atualizar documentação.

A release deverá ser interrompida quando a validação do pacote falhar. Não publicar um artefato apenas porque o build local terminou sem erros.

---

## 22. Governança e manutenção

Mesmo que inicialmente seja um projeto de uma pessoa, vale estabelecer regras simples desde o começo.

### 22.1 Arquivos e políticas

- `CONTRIBUTING.md`: instalação, comandos, testes e fluxo de contribuição;
- `CODE_OF_CONDUCT.md`: regras de convivência;
- `SECURITY.md`: vulnerabilidades;
- `CHANGELOG.md`: histórico;
- `LICENSE`: licença escolhida conscientemente;
- templates de issue e pull request;
- política de suporte e depreciação.

### 22.2 Critérios para aceitar uma contribuição

- objetivo e escopo claros;
- teste que reproduza o comportamento;
- impacto de acessibilidade analisado;
- documentação atualizada;
- sem aumento injustificado de dependências;
- sem quebra de API não documentada;
- compatibilidade do build verificada.

### 22.3 Política de depreciação

Uma API pública deverá passar por aviso de depreciação, documentação e janela de migração antes de ser removida em uma versão major, salvo problemas graves de segurança ou correção que exijam outra decisão explicitamente registrada.

---

## 23. Plano de implementação por etapas

### Etapa 0 — Preparação e decisões

**Objetivo:** reduzir incertezas antes de criar muitos componentes.

Tarefas:

- escolher nome e escopo dos pacotes;
- definir licença;
- criar repositório e convenções;
- decidir package manager e estratégia de monorepo;
- prototipar TypeScript + build + declarações;
- validar publicação local via tarball;
- escolher framework de referência inicial;
- definir estratégia de IDs e SSR;
- criar critérios de acessibilidade e testes.

**Saída:** repositório funcional, build mínimo e decisões arquiteturais registradas.

### Etapa 1 — Fundação comportamental

Tarefas:

- estado controlado/não controlado;
- IDs estáveis;
- composição e encaminhamento de refs;
- utilitários de teclado;
- foco e restauração;
- dismissable layer;
- portal;
- infraestrutura de testes;
- tokens iniciais e estrutura documental.

**Saída:** primitivas pequenas e testadas, sem abstrações especulativas.

### Etapa 2 — Componentes de menor risco

Ordem recomendada:

1. Button;
2. Accordion;
3. Tabs;
4. Tooltip.

**Saída:** primeiros componentes demonstram convenções de API e qualidade de documentação.

### Etapa 3 — Camadas e widgets compostos

Ordem recomendada:

5. Dialog;
6. Menu;
7. Select;
8. Toast.

A ordem poderá mudar conforme dependências técnicas identificadas durante o desenvolvimento. Dialog e Menu são fundações importantes para gerenciamento de camadas e foco; Select deve avançar somente depois da estratégia de combobox estar validada.

**Saída:** oito componentes implementados, testados e documentados.

### Etapa 4 — Qualidade de release

Tarefas:

- testes em navegadores suportados;
- revisão manual de acessibilidade;
- validação de SSR;
- projeto consumidor de teste;
- relatório de bundle;
- documentação final do MVP;
- changelog;
- configuração de CI e publicação.

**Saída:** primeira versão publicável.

### Etapa 5 — Expansão multi-framework

Tarefas:

- estabelecer contrato comportamental compartilhado;
- implementar adaptador Vue;
- implementar adaptador Svelte;
- executar testes de paridade;
- documentar diferenças idiomáticas;
- validar SSR e hidratação em cada framework.

**Saída:** suporte multi-framework demonstrado e testado, não apenas declarado no README.

### Etapa 6 — Ecossistema avançado

Tarefas:

- tokens completos e temas;
- i18n/RTL ampliados;
- novos componentes;
- codemods úteis;
- documentação interativa avançada;
- melhoria de suporte e governança.

**Saída:** plataforma madura e sustentável.

---

## 24. Critérios gerais de pronto (Definition of Done)

Um pacote ou componente não será considerado concluído apenas porque renderiza visualmente.

### Para cada componente

- [ ] propósito, escopo e limitações documentados;
- [ ] padrão de interação definido;
- [ ] estrutura HTML e semântica revisadas;
- [ ] teclado implementado e documentado;
- [ ] foco inicial, navegação e restauração testados, quando aplicável;
- [ ] estados controlado e não controlado testados, quando aplicável;
- [ ] itens desabilitados e atualizações dinâmicas cobertos;
- [ ] relações ARIA e IDs testados;
- [ ] axe-core executado sem violações bloqueadoras não justificadas;
- [ ] roteiro manual concluído;
- [ ] exemplo headless sem tema;
- [ ] exemplo com estilo customizado;
- [ ] tipagens públicas revisadas;
- [ ] pacote e imports verificados;
- [ ] casos de borda relevantes documentados.

### Para o MVP

- [ ] oito componentes especificados e implementados;
- [ ] primitivas centrais cobertas;
- [ ] build modular e tree-shaking demonstrados;
- [ ] tipagens publicadas;
- [ ] instalação testada em projeto consumidor;
- [ ] documentação navegável;
- [ ] CI bloqueando regressões essenciais;
- [ ] changelog e versionamento funcionando;
- [ ] release reproduzível;
- [ ] licença e políticas do repositório definidas.

---

## 25. Riscos técnicos e respectivas mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Implementar ARIA sem seguir o padrão de interação | Alto | Usar APG, testes de teclado e revisão manual |
| Criar um core excessivamente genérico | Alto | Extrair somente primitivas justificadas por casos reais |
| Tentar suportar três frameworks desde o primeiro commit | Alto | Começar por um adaptador de referência e validar arquitetura compartilhada |
| Componentes customizados incompatíveis com AT | Alto | Preferir HTML nativo quando viável e testar combinações reais |
| Select customizado complexo demais | Alto | Limitar o MVP a select-only single-select e comparar com `<select>` nativo |
| Focus trap com falhas em dialogs aninhados | Alto | Criar suíte específica de camadas e foco |
| API polimórfica difícil de manter | Médio/alto | Evitar magia prematura e testar refs/handlers/semântica |
| Tree-shaking apenas nominal | Médio | Validar bundle em app externa e imports por subpath |
| SSR incompatível | Alto | Evitar globals em import-time e incluir testes de SSR/hidratação |
| Pacotes fragmentados em excesso | Médio | Começar com poucos pacotes coesos |
| Codemods que alteram código incorretamente | Alto | Transformar apenas padrões determinísticos, com preview e testes |
| Documentação desatualizada | Médio/alto | Tornar atualização documental parte da Definition of Done |
| Dependências vulneráveis ou abandonadas | Médio/alto | Revisões periódicas, auditorias e dependências mínimas |
| Prometer acessibilidade sem validação suficiente | Alto | Publicar matriz de testes e limitações conhecidas |

---

## 26. Decisões em aberto

As seguintes decisões ainda não estão definidas pelo resumo original e deverão ser tomadas conscientemente antes de serem consideradas definitivas:

1. **Nome do projeto e escopo npm:** definir marca, organização e nomes finais dos pacotes.
2. **Licença:** escolher entre licenças permissivas ou outra estratégia, considerando uso e contribuição.
3. **Framework inicial:** recomendação de começar com React como adaptador de referência, mas confirmar conforme público e objetivo do projeto.
4. **Gerenciador de pacotes:** npm, pnpm ou outro; escolher um e fixar lockfile.
5. **Monorepo:** confirmar a necessidade e ferramenta, sem adicionar complexidade excessiva.
6. **Build:** prototipar Rollup e esbuild e selecionar uma pipeline principal.
7. **Modelo de API:** confirmar componentes compostos e convenções de nomes.
8. **Select:** customizado select-only ou wrapper de `<select>` nativo.
9. **Dialog:** escopo inicial modal apenas ou suporte não modal desde o começo.
10. **Temas:** definir se o primeiro tema será referência de documentação ou pacote separado.
11. **Browsers e AT:** publicar a matriz de ambientes oficialmente suportados.
12. **Política de suporte:** definir duração de suporte, ritmo de release e processo de depreciação.

Não preencher essas lacunas com decisões invisíveis. Toda escolha que impactar API pública ou compatibilidade deverá ser registrada em ADR (Architecture Decision Record).

---

## 27. Architecture Decision Records (ADRs)

Criar uma pasta `docs/adr/` com registros curtos para decisões importantes.

Modelo sugerido:

```text
# ADR-0001: [Título]

- Status: Proposed | Accepted | Superseded
- Data: AAAA-MM-DD

## Contexto
Qual problema ou decisão precisa ser resolvida?

## Opções consideradas
Quais alternativas foram avaliadas?

## Decisão
O que será adotado?

## Consequências
Quais benefícios, custos, limitações e riscos surgem?

## Evidências
Links para documentação, protótipos e testes.
```

ADRs iniciais recomendados:

- arquitetura de pacotes e monorepo;
- framework de referência;
- estratégia de IDs e SSR;
- gerenciamento de foco;
- política de portal e camadas;
- estratégia do Select;
- estratégia de build e formatos de pacote;
- política de compatibilidade multi-framework.

---

## 28. Métricas de sucesso

O projeto deverá medir qualidade e adoção sem reduzir tudo a quantidade de componentes.

### Qualidade técnica

- taxa de testes essenciais aprovados;
- quantidade e gravidade de regressões de acessibilidade;
- falhas de teclado/foco encontradas após release;
- compatibilidade com ambientes oficialmente suportados;
- falhas de instalação e import;
- estabilidade das APIs públicas.

### Experiência do desenvolvedor

- tempo para instalar e implementar um componente;
- clareza da documentação;
- número de dependências obrigatórias;
- facilidade de estilização;
- qualidade das mensagens de erro e dos tipos;
- custo de atualização entre versões.

### Eficiência do pacote

- tamanho por componente;
- tamanho das primitivas compartilhadas;
- quantidade de código não utilizado removido pelo tree-shaking;
- custo de build e publicação.

### Adoção

- instalações e downloads;
- issues e solicitações de suporte;
- uso em aplicações reais;
- contribuições externas;
- feedback de desenvolvedores e profissionais de acessibilidade.

As metas numéricas deverão ser estabelecidas após a primeira versão mensurável, evitando definir indicadores sem baseline.

---

## 29. Glossário

| Termo | Significado neste projeto |
|---|---|
| Headless | Comportamento e semântica sem aparência visual obrigatória |
| Primitiva | Utilitário comportamental de baixo nível reutilizado por componentes |
| Design token | Valor nomeado e reutilizável de design |
| Tema | Mapeamento de tokens para uma identidade visual |
| ARIA | Atributos e roles para comunicar semântica e estado a tecnologias assistivas |
| APG | Guia de padrões de autoria WAI-ARIA com orientações e exemplos de interação |
| WCAG | Diretrizes de acessibilidade para conteúdo web |
| Roving tabindex | Técnica para navegar entre itens de um widget composto mantendo um item na ordem de Tab |
| Focus trap/scope | Controle da movimentação do foco em uma região, quando o padrão exige |
| Portal | Renderização de conteúdo em outro ponto da árvore DOM |
| Tree-shaking | Remoção de exports/código não utilizado pelo consumidor |
| SSR | Renderização do HTML no servidor |
| Hydration | Processo de conectar comportamento JavaScript ao HTML renderizado no servidor |
| SemVer | Versionamento semântico de APIs e pacotes |
| Codemod | Transformação automatizada de código-fonte para migração |
| RTL | Direção de escrita da direita para a esquerda |
| i18n | Preparação de software para diferentes idiomas e convenções locais |

---

## 30. Referências técnicas oficiais

As referências abaixo sustentam os padrões e decisões técnicas indicados neste documento. Devem ser revisitadas antes de cada release relevante, pois especificações, ferramentas e suporte de navegadores evoluem.

### Acessibilidade e padrões de interação

- [W3C — Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C WAI — ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [W3C WAI — APG: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [APG — Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [APG — Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)
- [APG — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [APG — Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
- [APG — Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [APG — Select-Only Combobox Example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/)
- [APG — Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

### Frameworks e renderização

- [React — createPortal](https://react.dev/reference/react-dom/createPortal)
- [Vue — Composables](https://vuejs.org/guide/reusability/composables)
- [Svelte — Documentation](https://svelte.dev/docs)

### Build e distribuição

- [Rollup — Configuration Options](https://rollupjs.org/configuration-options/)
- [esbuild — API e Tree Shaking](https://esbuild.github.io/api/#tree-shaking)
- [Node.js — Publishing a package](https://nodejs.org/learn/modules/publishing-a-package)
- [npm — Trusted publishing](https://docs.npmjs.com/trusted-publishers/)

### Ferramentas de teste

- [Testing Library](https://testing-library.com/docs/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Playwright](https://playwright.dev/docs/intro)
- [Vitest](https://vitest.dev/guide/)

**Observação:** as referências orientam a implementação, mas não substituem testes próprios. Exemplos do APG podem ter limitações de suporte e não devem ser copiados sem avaliação crítica.

---

## 31. Síntese final da proposta

O projeto deverá ser construído como uma **biblioteca de infraestrutura para interfaces**, centrada em comportamento, semântica, acessibilidade e liberdade visual.

A execução mais segura e eficiente é:

1. estabelecer contratos e infraestrutura mínimos;
2. implementar primitivas compartilhadas somente quando justificadas;
3. entregar os oito componentes do MVP com acessibilidade demonstrável;
4. validar build, imports, tipagens e uso real em uma aplicação consumidora;
5. publicar uma primeira versão documentada e testada;
6. expandir para Vue e Svelte com adaptadores próprios e testes de paridade;
7. adicionar temas, tokens avançados, i18n/RTL, novos componentes e codemods conforme necessidade comprovada.

O sucesso não deverá ser medido por quantos componentes a biblioteca contém, mas por quão corretamente eles funcionam, quão simples é personalizá-los e quão confiável é sua integração em aplicações reais.

**Princípio central do produto:** entregar a complexidade comportamental e de acessibilidade que deve ser compartilhada, sem retirar do consumidor a liberdade de definir como sua interface deve parecer.
