export interface KeyboardShortcutSpec {
  component: string;
  key: string;
  behaviorLtr: string;
  behaviorRtl: string;
}

export const KEYBOARD_ACCESSIBILITY_MATRIX: KeyboardShortcutSpec[] = [
  {
    component: 'Button',
    key: 'Enter / Space',
    behaviorLtr: 'Ativa o botão (nativo ou polimórfico) se não estiver disabled/loading.',
    behaviorRtl: 'Idêntico ao LTR.'
  },
  {
    component: 'Dialog',
    key: 'Tab / Shift+Tab / Escape',
    behaviorLtr: 'Cicla o foco estritamente dentro do modal (Focus Trap); Escape fecha e restaura foco.',
    behaviorRtl: 'Idêntico ao LTR.'
  },
  {
    component: 'Menu',
    key: 'ArrowDown / ArrowUp / Home / End / A-Z',
    behaviorLtr: 'Navega pelos itens habilitados; caracteres acionam typeahead NFD sem acentos.',
    behaviorRtl: 'Idêntico ao LTR.'
  },
  {
    component: 'Tabs (Horizontal)',
    key: 'ArrowRight / ArrowLeft',
    behaviorLtr: 'ArrowRight avança para a próxima aba; ArrowLeft retrocede.',
    behaviorRtl: 'Espelhado: ArrowLeft avança para a próxima aba; ArrowRight retrocede.'
  },
  {
    component: 'Tooltip',
    key: 'Focus / Blur / Escape',
    behaviorLtr: 'Abre imediatamente ao receber foco; fecha imediatamente com Escape.',
    behaviorRtl: 'Idêntico ao LTR.'
  },
  {
    component: 'Select',
    key: 'ArrowDown / ArrowUp / Enter / Space / Escape',
    behaviorLtr: 'Abre listbox, percorre opções habilitadas e seleciona opção destacada.',
    behaviorRtl: 'Idêntico ao LTR.'
  },
  {
    component: 'Toast',
    key: 'Focus / Hover / Escape',
    behaviorLtr: 'Pausa timer WCAG 2.2.1 no foco/hover; Escape dispensa a notificação.',
    behaviorRtl: 'Idêntico ao LTR.'
  },
  {
    component: 'Accordion',
    key: 'ArrowDown / ArrowUp / Home / End / Enter / Space',
    behaviorLtr: 'Move foco entre cabeçalhos de seção e alterna expansão do painel.',
    behaviorRtl: 'Idêntico ao LTR.'
  }
];

export function renderKeyboardMatrixSection(doc: Document = document): HTMLElement {
  const section = doc.createElement('section');
  section.id = 'demo-keyboard-matrix';
  section.setAttribute('aria-labelledby', 'heading-keyboard-matrix');
  section.style.marginBlock = '1.5rem';
  section.style.padding = '1rem';
  section.style.border = '1px solid currentColor';
  section.style.borderRadius = '0.5rem';

  const h2 = doc.createElement('h2');
  h2.id = 'heading-keyboard-matrix';
  h2.textContent = '10. Matriz de Contratos de Teclado WAI-ARIA (LTR vs RTL)';

  const table = doc.createElement('table');
  table.setAttribute('aria-label', 'Contratos de navegação por teclado por componente');

  const thead = doc.createElement('thead');
  const headerRow = doc.createElement('tr');
  for (const col of ['Componente', 'Teclas', 'Comportamento LTR', 'Comportamento RTL']) {
    const th = doc.createElement('th');
    th.scope = 'col';
    th.textContent = col;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  const tbody = doc.createElement('tbody');
  for (const row of KEYBOARD_ACCESSIBILITY_MATRIX) {
    const tr = doc.createElement('tr');
    for (const val of [row.component, row.key, row.behaviorLtr, row.behaviorRtl]) {
      const td = doc.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.append(thead, tbody);
  section.append(h2, table);
  return section;
}
