# @forma-ui/themes

Camada visual **100% opcional e plugável** para `@forma-ui`. Estiliza componentes exclusivamente através de seletores de atributos semânticos (`[data-forma-*]`, `[data-state]`, `[aria-selected]`) e CSS Custom Properties (`--forma-*`), sem impor classes utilitárias no markup.

## Instalação

```bash
pnpm add @forma-ui/themes @forma-ui/tokens
```

## Temas Incluídos e API
- `lightTheme`: Tema claro padrão com contraste validado WCAG AA/AAA.
- `darkTheme`: Tema escuro calibrado para baixa fadiga visual.
- `highContrastTheme`: Tema de alto contraste extremo (`21:1`) em conformidade com WCAG 2.1 AAA.
- `createTheme(name, overrides)`: Cria temas customizados herdando a escala base de tokens.
- `applyTheme(theme, targetElement)`: Aplica variáveis CSS em runtime e retorna função de cleanup/reversão.
- `generateCompleteThemeCss()` & `@forma-ui/themes/styles.css`: Folha de estilo estática pronta para importação opcional.
