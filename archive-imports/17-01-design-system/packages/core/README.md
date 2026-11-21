# @forma-ui/core

Núcleo headless agnóstico de estilo e de framework. Fornece 13 módulos de primitivas WAI-ARIA/DOM e as 8 máquinas de estado do MVP com *tree-shaking* individual por subpath (`"sideEffects": false`).

## Instalação e Importação Modular (Tree-Shakeable)

```ts
import { getButtonProps } from '@forma-ui/core/button';
import { createDialogMachine } from '@forma-ui/core/dialog';
import { createMenuMachine } from '@forma-ui/core/menu';
import { createTabsMachine } from '@forma-ui/core/tabs';
import { createTooltipMachine } from '@forma-ui/core/tooltip';
import { createSelectMachine } from '@forma-ui/core/select';
import { createToastStore } from '@forma-ui/core/toast';
import { createAccordionMachine } from '@forma-ui/core/accordion';
import {
  createFocusTrap,
  acquireBodyScrollLock,
  ariaHideOutside,
  computeFloatingPosition,
  createI18nManager
} from '@forma-ui/core/primitives';
```

## Primitivas Incluídas (`@forma-ui/core/primitives`)
- **`focus.ts` (`createFocusTrap`, `getTabbableElements`):** Armadilha de foco empilhável com restauração automática de foco ao fechar modais.
- **`scroll-lock.ts` (`acquireBodyScrollLock`):** Bloqueio de rolagem com contagem de referência e compensação da largura da barra de rolagem (`--forma-scrollbar-width`).
- **`aria-hide-outside.ts` (`ariaHideOutside`):** Isola o conteúdo externo aplicando `aria-hidden="true"` enquanto modais estão abertos.
- **`roving-tabindex.ts` (`getNextRovingIndex`):** Navegação 1D/2D por setas, `Home`/`End` e espelhamento automático de `ArrowLeft`/`ArrowRight` em RTL.
- **`typeahead.ts` (`createTypeahead`):** Busca incremental insensível a acentos (normalização Unicode NFD) e ciclagem por caractere repetido.
- **`dismissable-layer.ts` (`createDismissableLayer`):** Pilha global para fechamento ordenado via `Escape` ou clique externo.
- **`positioner.ts` (`computeFloatingPosition`):** Posicionamento flutuante com detecção de colisão de viewport, flip, shift e espelhamento RTL.
- **`portal.ts`, `live-region.ts`, `i18n.ts`, `keyboard.ts`, `dom.ts`, `id.ts`.**
