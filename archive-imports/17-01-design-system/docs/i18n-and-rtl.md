# Internacionalização (i18n) e Suporte Bidirecional (LTR / RTL)

## 1. Arquitetura do `createI18nManager`
O módulo `@forma-ui/core/primitives` fornece um gerenciador reativo de internacionalização com dicionários nativos integrados para quatro localidades:
- **`pt-BR` (Português — Brasil):** Direção `ltr` (Padrão)
- **`en-US` (Inglês — EUA):** Direção `ltr`
- **`es-ES` (Espanhol — Espanha):** Direção `ltr`
- **`ar-SA` (Árabe — Arábia Saudita):** Direção `rtl`

A função `getDirectionForLocale(locale)` detecta automaticamente qualquer código de idioma da família RTL (`ar`, `he`, `fa`, `ur`, `ps`, `sd`, `yi`) e ajusta `state.dir = 'rtl'`.

## 2. Espelhamento de Teclado em Modo RTL
De acordo com as práticas WAI-ARIA Authoring Practices Guide (APG), componentes orientados horizontalmente invertem a direção lógica das setas horizontais quando `dir === 'rtl'`:
- Em **LTR (`dir="ltr"`)**: `ArrowRight` avança para o próximo item (`+1`) e `ArrowLeft` retrocede para o item anterior (`-1`).
- Em **RTL (`dir="rtl"`)**: `ArrowLeft` avança para o próximo item (`+1`) e `ArrowRight` retrocede para o item anterior (`-1`).
- Teclas verticais (`ArrowDown`, `ArrowUp`) e de extremidade (`Home`, `End`) permanecem inalteradas em ambas as direções.

## 3. Posicionamento Flutuante e Propriedades Lógicas CSS
- **Motor `computeFloatingPosition`:** Quando `dir === 'rtl'`, os alinhamentos horizontais `bottom-start` / `top-start` e `bottom-end` / `top-end` são automaticamente espelhados para alinhar o elemento flutuante com a borda inicial correta da leitura da direita para a esquerda.
- **CSS Lógico em `@forma-ui/tokens` e `@forma-ui/themes`:** Todas as folhas de estilo opcionais utilizam `inset-inline-start`, `inset-block-start`, `inline-size`, `border-block-end` e `text-align: start` em vez de propriedades físicas `left`/`right`.
