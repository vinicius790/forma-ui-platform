# @forma-ui/themes

Camada visual opcional, separada dos pacotes headless. Inclui temas `light`, `dark` e `high-contrast` como custom properties CSS.

```ts
import { applyTheme } from '@forma-ui/themes';

const restorePreviousTheme = applyTheme('dark');
// Quando a aplicação trocar de tema ou desmontar:
restorePreviousTheme();
```

Ou importe o CSS gerado:

```ts
import '@forma-ui/themes/styles.css';
```

Defina `data-forma-theme="light"`, `"dark"` ou `"high-contrast"` no elemento raiz. Sobrescreva as custom properties com sua própria camada visual. O pacote não estiliza os elementos dos componentes, nem garante que cores customizadas mantenham contraste: teste a paleta real após as sobrescritas.
