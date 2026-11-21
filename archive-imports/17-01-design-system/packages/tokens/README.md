# @forma-ui/tokens

Fundação de Design Tokens agnósticos de estilo e framework para o ecossistema `@forma-ui`, com suporte a CSS Custom Properties (`--forma-*`), especificação W3C Design Tokens Community Group (DTCG) e auditoria matemática de contraste WCAG 2.1.

## Instalação

```bash
pnpm add @forma-ui/tokens
```

## API Pública

### Escalas e Tokens Semânticos
- `colorScale`: Paletas `neutral`, `brand`, `success`, `warning`, `danger` e `info`.
- `semanticColorsLight`: Mapeamento semântico (`bgCanvas`, `bgSurface`, `fgPrimary`, `fgSecondary`, `accentPrimary`, `focusRing`, etc.).
- `spacingTokens`: Escala proporcional de `0` a `24` (`0rem` a `6rem`).
- `typographyTokens`: Famílias (`sans`, `mono`), tamanhos (`xs` a `3xl`), pesos, `lineHeight` e `letterSpacing`.
- `radiiTokens`, `shadowTokens`, `zIndexTokens`, `motionTokens`: Elevação, camadas de sobreposição e curvas de animação.

### Geração de CSS Custom Properties e W3C JSON
```ts
import {
  defaultTokens,
  tokensToCssVariables,
  cssVar,
  toW3CTokens,
  evaluateWcagContrast
} from '@forma-ui/tokens';

const vars = tokensToCssVariables(defaultTokens, 'forma');
// => { '--forma-color-accent-primary': '#4f46e5', '--forma-space-4': '1rem', ... }

const buttonBg = cssVar('color-accent-primary', '#4f46e5');
// => 'var(--forma-color-accent-primary, #4f46e5)'

const contrast = evaluateWcagContrast('#0f172a', '#ffffff');
// => { ratio: 17.85, passesAA: true, passesAAA: true, passesUIComponent: true }
```
