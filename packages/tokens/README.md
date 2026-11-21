# @forma-ui/tokens

Tokens independentes de framework: paletas primitivas e semânticas, tipografia, espaçamento, raios, sombras, z-index e motion. Nenhum token é aplicado automaticamente aos componentes.

```ts
import { contrastRatio, meetsWCAG, toCssVariables, semanticColors } from '@forma-ui/tokens';

const ratio = contrastRatio(semanticColors.light.text, semanticColors.light.surface);
const passes = meetsWCAG('#0f172a', '#ffffff', 'AA');
const css = toCssVariables({ color: { text: '#0f172a' }, spacing: { control: '1rem' } });
```

## Exportações

- Importação principal: cores, tokens tipográficos, espaçamento, elevação, propriedades lógicas e contraste.
- `@forma-ui/tokens/colors` e `@forma-ui/tokens/contrast`: entradas menores para tree-shaking.
- `@forma-ui/tokens/tokens.json`: arquivo gerado em formato compatível com o vocabulário DTCG (`$type`/`$value`).

O cálculo de contraste é uma ferramenta de projeto para cores opacas em formatos suportados (`#RGB`, `#RRGGBB`, `rgb()`/`rgba()`); não substitui avaliação de imagens, transparência, estados, texto real ou requisitos WCAG aplicáveis ao conteúdo final.
