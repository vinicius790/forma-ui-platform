import {
  defaultTokens,
  tokensToCssVariables,
  evaluateWcagContrast
} from '@forma-ui/tokens';

export interface ContrastPairSummary {
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

export function computeThemeContrastPairs(): ContrastPairSummary[] {
  const c = defaultTokens.colors;
  const pairs: Array<{ name: string; fg: string; bg: string }> = [
    { name: 'Texto Primário sobre Canvas', fg: c.fgPrimary, bg: c.bgCanvas },
    { name: 'Texto Secundário sobre Canvas', fg: c.fgSecondary, bg: c.bgCanvas },
    { name: 'Texto Primário sobre Surface', fg: c.fgPrimary, bg: c.bgSurface },
    { name: 'Texto Inverso sobre Accent Primary', fg: c.fgInverse, bg: c.accentPrimary },
    { name: 'Status Danger sobre Canvas', fg: c.statusDanger, bg: c.bgCanvas }
  ];

  return pairs.map((p) => {
    const res = evaluateWcagContrast(p.fg, p.bg);
    return {
      name: p.name,
      foreground: p.fg,
      background: p.bg,
      ratio: res.ratio,
      passesAA: res.passesAA,
      passesAAA: res.passesAAA
    };
  });
}

export function renderTokenTable(doc: Document = document): HTMLElement {
  const section = doc.createElement('section');
  section.id = 'demo-tokens-reference';
  section.setAttribute('aria-labelledby', 'heading-tokens-reference');
  section.style.marginBlock = '1.5rem';
  section.style.padding = '1rem';
  section.style.border = '1px solid currentColor';
  section.style.borderRadius = '0.5rem';

  const h2 = doc.createElement('h2');
  h2.id = 'heading-tokens-reference';
  h2.textContent = '9. Catálogo de Design Tokens (--forma-*) & Auditoria de Contraste WCAG 2.1';

  const vars = tokensToCssVariables(defaultTokens);
  const summaryP = doc.createElement('p');
  summaryP.textContent = `Total de CSS Custom Properties ativas: ${Object.keys(vars).length} variáveis.`;

  const table = doc.createElement('table');
  table.setAttribute('aria-label', 'Matriz de Contraste WCAG 2.1 dos Tokens Semânticos');
  const thead = doc.createElement('thead');
  const headerRow = doc.createElement('tr');
  for (const col of ['Par Semântico', 'Foreground', 'Background', 'Razão WCAG', 'Nível']) {
    const th = doc.createElement('th');
    th.scope = 'col';
    th.textContent = col;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  const tbody = doc.createElement('tbody');
  for (const item of computeThemeContrastPairs()) {
    const tr = doc.createElement('tr');
    const cells = [
      item.name,
      item.foreground,
      item.background,
      `${item.ratio}:1`,
      item.passesAAA ? 'AAA' : item.passesAA ? 'AA' : 'Falha'
    ];
    for (const text of cells) {
      const td = doc.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.append(thead, tbody);
  section.append(h2, summaryP, table);
  return section;
}
