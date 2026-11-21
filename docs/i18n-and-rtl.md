# Internacionalização e RTL

## Configuração

`createI18n({ locale, direction?, messages? })` resolve uma direção padrão a partir do idioma e aceita sobrescrita explícita. O consumidor deve manter `lang` e `dir` atualizados no documento e em raízes isoladas. Os portais herdam `lang`/`dir` do contêiner mais próximo que os declare; sem contêiner explícito, usam os valores da raiz do documento.

## Princípios

- Use propriedades CSS lógicas (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`) em vez de `left`/`right` físicos.
- Trate RTL como direção de leitura, não como uma tradução visual completa.
- Setas horizontais são espelhadas onde o padrão define navegação relativa à direção; setas verticais permanecem inalteradas.
- Home/End e foco seguem a ordem lógica definida pelo padrão.
- Textos de botões internos devem vir de mensagens configuráveis ou ser fornecidos pelo consumidor.
- Não derive locale do `navigator` no módulo de forma implícita; permita configuração determinística por aplicação/SSR.

## Typeahead e Unicode

Typeahead normaliza texto com decomposição Unicode NFD, remove marcas diacríticas e compara sem distinção de maiúsculas/minúsculas. Esta normalização é uma melhoria prática para idiomas latinos, não uma regra universal para todos os sistemas de escrita. Para locais complexos, o consumidor deve avaliar `Intl.Collator` ou busca especializada e testar com falantes reais.

## Matriz

Valide ao menos LTR e RTL para menu, tabs, select e qualquer popup posicionado. Teste idiomas com e sem marcas combinantes, nomes longos, conteúdo misto e nomes acessíveis traduzidos.
