import {
  createAccordionController,
  createCheckboxController,
  createComboboxController,
  createPaginationController,
  createSliderController,
  createSwitchController,
  createDialogController,
  createMenuController,
  createSelectController,
  createTabsController,
  createToastStore,
  createTooltipController,
} from '@forma-ui/core';
import { applyTheme, type ThemeName } from '@forma-ui/themes';
import { semanticColors } from '@forma-ui/tokens';
import { auditAccessibility } from '@forma-ui/a11y-testing';
import { renderKeyboardMatrix } from './keyboard-matrix';
import { renderTokenVisualizer } from './token-visualizer';

const toolbar = document.querySelector<HTMLElement>('#toolbar')!;
const app = document.querySelector<HTMLElement>('#app')!;
const toastRegion = document.querySelector<HTMLOListElement>('#toast-region')!;
const cleanups: Array<() => void> = [];
const toastStore = createToastStore({ duration: 4500, max: 4 });
let locale = 'pt-BR';
let direction: 'ltr' | 'rtl' = 'ltr';
let activeThemeCleanup = applyTheme('light');

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text) node.textContent = text;
  return node;
}

function panel(title: string, description: string): HTMLElement {
  const section = element('section', { class: 'panel' });
  section.append(element('h2', {}, title), element('p', {}, description));
  return section;
}

function button(
  text: string,
  action: () => void,
  attributes: Record<string, string> = {},
): HTMLButtonElement {
  const node = element('button', { type: 'button', ...attributes }, text);
  node.addEventListener('click', action);
  return node;
}

function clearPlayground(): void {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  app.replaceChildren();
  toastRegion.replaceChildren();
}

function buildToolbar(): void {
  toolbar.replaceChildren();

  const themeLabel = element('label', {}, 'Tema ');
  const theme = element('select', { 'aria-label': 'Tema' });
  for (const name of ['light', 'dark', 'high-contrast'] as ThemeName[]) {
    theme.append(element('option', { value: name }, name));
  }
  theme.addEventListener('change', () => {
    activeThemeCleanup();
    activeThemeCleanup = applyTheme(theme.value as ThemeName);
    renderTokenVisualizer(document.querySelector('#tokens')!);
  });
  themeLabel.append(theme);

  const localeLabel = element('label', {}, 'Idioma ');
  const language = element('select', { 'aria-label': 'Idioma' });
  for (const code of ['pt-BR', 'en-US', 'ar']) {
    language.append(element('option', { value: code }, code));
  }
  language.addEventListener('change', () => {
    locale = language.value;
    direction = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    buildPlayground();
  });
  localeLabel.append(language);

  const audit = button('Executar auditoria axe-core', () => void runAudit());
  toolbar.append(themeLabel, localeLabel, audit);
}

function buildPlayground(): void {
  clearPlayground();
  app.dir = direction;
  const grid = element('div', { class: 'grid' });

  // 1. Button — usa a semântica nativa do HTML.
  const buttonPanel = panel(
    '1. Button',
    'Usa o elemento HTML button nativo; Enter e Espaço são providos pelo navegador.',
  );
  buttonPanel.append(
    button('Ação nativa', () => toastStore.add({
      title: 'Button',
      description: 'Ação ativada por mouse ou teclado.',
      tone: 'success',
    })),
    element('p', {}, 'Estado desabilitado:'),
    element('button', { disabled: '', type: 'button' }, 'Indisponível'),
  );

  // 2. Dialog — foco contido, isolamento externo e restauração.
  const dialogPanel = panel(
    '2. Dialog',
    'Modal com Escape, fechamento explícito, foco inicial e restauração do foco.',
  );
  const overlay = element('div', { class: 'overlay', hidden: '' });
  const content = element('section', {
    class: 'dialog',
    role: 'dialog',
    id: 'demo-dialog-content',
    'aria-modal': 'true',
    'aria-labelledby': 'demo-dialog-title',
    tabindex: '-1',
  });
  const trigger = button('Abrir diálogo', () => dialog.show(), {
    'aria-controls': 'demo-dialog-content',
    'aria-expanded': 'false',
  });
  const dialog = createDialogController({
    onOpenChange: (open) => {
      overlay.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
    },
  });
  dialog.setTrigger(trigger);
  content.append(
    element('h3', { id: 'demo-dialog-title' }, 'Exemplo de dialog'),
    element('p', {}, 'Use Tab/Shift+Tab para percorrer o conteúdo. Escape fecha o modal.'),
    button('Fechar', () => dialog.close()),
  );
  overlay.append(content);
  document.body.append(overlay);
  dialog.setContent(content);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) dialog.close();
  });
  cleanups.push(() => {
    dialog.destroy();
    overlay.remove();
  });
  dialogPanel.append(trigger);

  // 3. Menu — navegação entre comandos e fechamento por interação externa.
  const menuPanel = panel(
    '3. Menu',
    'Menu de comandos com setas, Home/End, typeahead, Escape e clique externo.',
  );
  const menuContent = element('div', {
    class: 'menu',
    id: 'demo-menu',
    role: 'menu',
    'aria-label': 'Ações de exemplo',
    tabindex: '-1',
    hidden: '',
  });
  const menuTrigger = button('Abrir menu ▾', () => menu.setOpen(!menu.open), {
    'aria-haspopup': 'menu',
    'aria-controls': 'demo-menu',
    'aria-expanded': 'false',
  });
  const menu = createMenuController({
    direction,
    onOpenChange: (open) => {
      menuContent.hidden = !open;
      menuTrigger.setAttribute('aria-expanded', String(open));
    },
  });
  const menuLabels = ['Editar', 'Duplicar', 'Arquivar'];
  menuLabels.forEach((label, index) => {
    const node = element('button', { type: 'button', role: 'menuitem', tabindex: '-1' }, label);
    const record = {
      id: `menu-${index}`,
      element: node,
      textValue: label,
      onSelect: () => toastStore.add({ title: 'Menu', description: `${label} selecionado.` }),
    };
    menu.registerItem(record);
    node.addEventListener('click', () => menu.getItemProps(record).onClick());
    node.addEventListener('pointermove', () => menu.getItemProps(record).onPointerMove());
    menuContent.append(node);
  });
  menu.setTrigger(menuTrigger);
  menu.setContent(menuContent);
  menuContent.addEventListener('keydown', (event) => menu.onKeyDown(event));
  cleanups.push(() => menu.destroy());
  menuPanel.append(menuTrigger, menuContent);

  // 4. Tabs — roving focus e ativação automática.
  const tabsPanel = panel(
    '4. Tabs',
    'Roving focus, orientação e ativação automática para painéis locais imediatos.',
  );
  const tablist = element('div', { role: 'tablist', 'aria-label': 'Conteúdo de exemplo' });
  const tabNodes: HTMLButtonElement[] = [];
  const panelNodes: HTMLElement[] = [];
  const tabs = createTabsController({
    defaultValue: 'overview',
    direction,
    onValueChange: (value) => {
      for (const tab of tabNodes) {
        const active = tab.dataset['value'] === value;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      }
      for (const panelNode of panelNodes) {
        panelNode.hidden = panelNode.dataset['value'] !== value;
      }
    },
  });

  for (const [value, title, text] of [
    ['overview', 'Visão geral', 'Resumo do componente.'],
    ['details', 'Detalhes', 'Conteúdo complementar.'],
    ['history', 'Histórico', 'Registros anteriores.'],
  ] as const) {
    const id = `tab-${value}`;
    const panelId = `panel-${value}`;
    const node = element('button', {
      id,
      type: 'button',
      role: 'tab',
      'aria-controls': panelId,
      'aria-selected': String(value === 'overview'),
      tabindex: value === 'overview' ? '0' : '-1',
    }, title);
    node.dataset['value'] = value;
    const panelNode = element('div', {
      id: panelId,
      role: 'tabpanel',
      'aria-labelledby': id,
      tabindex: '0',
      ...(value === 'overview' ? {} : { hidden: '' }),
    }, text);
    panelNode.dataset['value'] = value;
    tabs.register({ value, id, panelId, element: node });
    tabNodes.push(node);
    panelNodes.push(panelNode);
    tablist.append(node);
    node.addEventListener('click', () => tabs.select(value));
    node.addEventListener('keydown', (event) => tabs.onKeyDown(event, value));
  }
  tabsPanel.append(tablist, ...panelNodes);

  // 5. Tooltip — permanece visível ao mover o ponteiro do gatilho para o conteúdo.
  const tooltipPanel = panel(
    '5. Tooltip',
    'Informação breve e não interativa; abre por foco ou hover e fecha com Escape.',
  );
  const tooltipId = 'demo-tooltip';
  const tip = element('span', { id: tooltipId, role: 'tooltip', hidden: '' }, 'Dica complementar e não interativa.');
  const tipTrigger = button('Passe o mouse ou foque', () => undefined);
  const tooltip = createTooltipController({
    delayDuration: 350,
    closeDelayDuration: 100,
    onOpenChange: (open) => {
      tip.hidden = !open;
      if (open) tipTrigger.setAttribute('aria-describedby', tooltipId);
      else tipTrigger.removeAttribute('aria-describedby');
    },
  });
  tooltip.setTrigger(tipTrigger);
  tooltip.setContent(tip);
  tooltipPanel.append(tipTrigger, tip);
  cleanups.push(() => tooltip.destroy());

  // 6. Select-only — seleção única. Um <select> nativo é preferível quando suficiente.
  const selectPanel = panel(
    '6. Select',
    'Combobox select-only simples com seleção única, typeahead, Escape e opções desabilitadas.',
  );
  const selectId = 'demo-select-listbox';
  const selectLabel = element('span', { id: 'demo-select-label' }, 'Escolha uma opção');
  const selected = element('p', {}, 'Valor selecionado: one');
  const options = [
    { value: 'one', label: 'Primeira opção' },
    { value: 'two', label: 'Segunda opção' },
    { value: 'three', label: 'Terceira opção', disabled: true },
  ];
  const selectList = element('div', {
    id: selectId,
    role: 'listbox',
    'aria-labelledby': 'demo-select-label',
    hidden: '',
  });
  const selectTrigger = button('Primeira opção ▾', () => undefined, {
    role: 'combobox',
    'aria-haspopup': 'listbox',
    'aria-controls': selectId,
    'aria-labelledby': 'demo-select-label',
    'aria-expanded': 'false',
  });
  const select = createSelectController({
    options,
    defaultValue: 'one',
    onOpenChange: () => syncSelect(),
    onValueChange: (value) => {
      selected.textContent = `Valor selecionado: ${value}`;
      const label = options.find((option) => option.value === value)?.label;
      if (label) selectTrigger.textContent = `${label} ▾`;
      syncSelect();
    },
  });
  select.setTrigger(selectTrigger);
  select.setListbox(selectList);

  function syncSelect(): void {
    selectTrigger.setAttribute('aria-expanded', String(select.open));
    selectList.hidden = !select.open;
    const activeDescendant = select.getTriggerProps(selectId, 'demo-select-label')['aria-activedescendant'];
    if (activeDescendant) selectTrigger.setAttribute('aria-activedescendant', activeDescendant);
    else selectTrigger.removeAttribute('aria-activedescendant');

    options.forEach((option, index) => {
      const node = selectList.children.item(index) as HTMLElement | null;
      if (!node) return;
      node.setAttribute('aria-selected', String(option.value === select.value));
      if (option.disabled) node.setAttribute('aria-disabled', 'true');
      else node.removeAttribute('aria-disabled');
      if (select.activeOptionIndex === index) node.setAttribute('data-highlighted', '');
      else node.removeAttribute('data-highlighted');
    });
  }

  options.forEach((option, index) => {
    const item = element('div', {
      id: `${selectId}-option-${index}`,
      role: 'option',
      tabindex: '-1',
      'data-option-index': String(index),
      'aria-selected': String(option.value === select.value),
      ...(option.disabled ? { 'aria-disabled': 'true' } : {}),
    }, option.label);
    const optionProps = select.getOptionProps(option, index, selectId);
    item.addEventListener('pointermove', () => {
      optionProps.onPointerMove();
      syncSelect();
    });
    item.addEventListener('click', () => {
      optionProps.onClick();
      syncSelect();
    });
    selectList.append(item);
  });
  selectTrigger.addEventListener('click', () => {
    select.toggle();
    syncSelect();
  });
  selectTrigger.addEventListener('keydown', (event) => {
    select.onKeyDown(event);
    syncSelect();
  });
  selectPanel.append(selectLabel, selectTrigger, selectList, selected);
  cleanups.push(() => select.destroy());

  // 7. Toast — região de status com temporizadores pausáveis.
  const toastPanel = panel(
    '7. Toast',
    'Notificações não modais; duração pausável ao passar o ponteiro ou receber foco.',
  );
  toastPanel.append(
    button('Adicionar toast', () => toastStore.add({
      title: 'Alterações salvas',
      description: 'A notificação desaparecerá após alguns segundos.',
      tone: 'success',
    })),
    button('Toast persistente', () => toastStore.add({
      title: 'Ação necessária',
      description: 'Esta mensagem não expira automaticamente.',
      tone: 'warning',
      duration: 0,
    })),
  );
  const renderToasts = () => {
    toastRegion.replaceChildren();
    for (const record of toastStore.getSnapshot()) {
      const item = element('li', {
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
      });
      item.append(
        element('strong', {}, record.title ?? 'Notificação'),
        element('p', {}, record.description ?? ''),
      );
      item.addEventListener('pointerenter', () => toastStore.pause(record.id));
      item.addEventListener('pointerleave', () => toastStore.resume(record.id));
      item.addEventListener('focusin', () => toastStore.pause(record.id));
      item.addEventListener('focusout', (event) => {
        if (!item.contains(event.relatedTarget as Node | null)) toastStore.resume(record.id);
      });
      if (record.action) item.append(button(record.action.label, record.action.onClick));
      if (record.dismissible) item.append(button('Dispensar', () => toastStore.dismiss(record.id)));
      toastRegion.append(item);
    }
  };
  const unsubscribeToasts = toastStore.subscribe(renderToasts);
  renderToasts();
  cleanups.push(unsubscribeToasts);

  // 8. Accordion — cabeçalhos de botão associados a regiões.
  const accordionPanel = panel(
    '8. Accordion',
    'Expansão/recolhimento com botão nativo e estados aria-expanded/aria-controls.',
  );
  const accordion = createAccordionController({ multiple: true, defaultValue: ['a'] });
  for (const [value, label, text] of [
    ['a', 'O que é headless?', 'A camada headless entrega comportamento e semântica, não estilos.'],
    ['b', 'Como funciona o tema?', 'O tema é opcional e pode ser substituído pelo consumidor.'],
  ] as const) {
    const triggerId = `accordion-trigger-${value}`;
    const panelId = `accordion-panel-${value}`;
    accordion.register(value);
    const triggerNode = button(label, () => {
      accordion.toggle(value);
      const open = accordion.isOpen(value);
      triggerNode.setAttribute('aria-expanded', String(open));
      contentNode.hidden = !open;
    }, {
      id: triggerId,
      'aria-controls': panelId,
      'aria-expanded': String(accordion.isOpen(value)),
    });
    const contentNode = element('div', {
      id: panelId,
      role: 'region',
      'aria-labelledby': triggerId,
      ...(accordion.isOpen(value) ? {} : { hidden: '' }),
    }, text);
    const heading = element('h3');
    heading.append(triggerNode);
    accordionPanel.append(heading, contentNode);
  }

  // 9–13. Expanded headless controls introduced in 0.2.0.
  const checkboxPanel = panel('9. Checkbox + indeterminate', 'Controlador checkbox com estado mixed e sincronização explícita da propriedade nativa indeterminate.');
  const checkbox = createCheckboxController({ defaultChecked: 'indeterminate' });
  const checkboxLabel = element('label', {}, 'Selecionar item');
  const checkboxInput = element('input', { type: 'checkbox' });
  checkboxInput.checked = checkbox.checked === true;
  checkboxInput.indeterminate = checkbox.checked === 'indeterminate';
  checkboxInput.addEventListener('change', () => { checkbox.setChecked(checkboxInput.checked); checkboxInput.indeterminate = checkbox.checked === 'indeterminate'; checkboxInput.checked = checkbox.checked === true; });
  checkboxLabel.prepend(checkboxInput);
  checkboxPanel.append(checkboxLabel);

  const switchPanel = panel('10. Switch', 'Botão nativo com role=switch e estado aria-checked; teclado nativo do botão preservado.');
  const switchController = createSwitchController({ defaultChecked: false });
  const switchButton = button('Desativado', () => { switchController.toggle(); switchButton.setAttribute('aria-checked', String(switchController.checked)); switchButton.textContent = switchController.checked ? 'Ativado' : 'Desativado'; }, { role: 'switch', 'aria-checked': 'false' });
  switchPanel.append(switchButton);

  const sliderPanel = panel('11. Slider', 'Slider nativo de exemplo com valor e limites acessíveis.');
  const slider = createSliderController({ min: 0, max: 100, step: 5, defaultValue: 35 });
  const sliderLabel = element('label', {}, 'Volume ');
  const sliderInput = element('input', { type: 'range', min: '0', max: '100', step: '5', value: '35', 'aria-label': 'Volume' });
  const sliderValue = element('output', {}, '35');
  sliderInput.addEventListener('input', () => { slider.setThumbValue(0, Number(sliderInput.value)); sliderValue.textContent = String(slider.values[0] ?? 0); });
  sliderLabel.append(sliderInput, sliderValue);
  sliderPanel.append(sliderLabel);

  const comboPanel = panel('12. Combobox', 'Campo de texto com listbox, opção ativa e seleção por teclado.');
  const combo = createComboboxController({ options: [{ value: 'recife', label: 'Recife' }, { value: 'fortaleza', label: 'Fortaleza' }, { value: 'salvador', label: 'Salvador' }] });
  const comboId = 'docs-city-listbox';
  const comboLabel = element('label', { for: 'docs-city-input' }, 'Cidade ');
  const comboInput = element('input', { id: 'docs-city-input', type: 'text', role: 'combobox', 'aria-controls': comboId, 'aria-expanded': 'false', 'aria-autocomplete': 'list' });
  const comboList = element('ul', { id: comboId, role: 'listbox', hidden: '' });
  const renderCombo = () => {
    comboList.replaceChildren();
    for (const option of [{ value: 'recife', label: 'Recife' }, { value: 'fortaleza', label: 'Fortaleza' }, { value: 'salvador', label: 'Salvador' }]) {
      const item = element('li', { role: 'option', 'aria-selected': String(combo.value === option.value) }, option.label);
      item.addEventListener('click', () => { combo.select(option.value); comboInput.value = option.label; comboInput.setAttribute('aria-expanded', String(combo.open)); comboList.hidden = !combo.open; });
      comboList.append(item);
    }
    comboInput.setAttribute('aria-expanded', String(combo.open));
    comboList.hidden = !combo.open;
  };
  comboInput.addEventListener('input', () => { combo.setInputValue(comboInput.value); renderCombo(); });
  comboInput.addEventListener('keydown', (event) => { combo.onKeyDown(event); renderCombo(); });
  comboLabel.append(comboInput);
  comboPanel.append(comboLabel, comboList);

  const paginationPanel = panel('13. Pagination', 'Paginação com limites consistentes, aria-current e reticências compactas.');
  const pagination = createPaginationController({ pageCount: 8, defaultPage: 3 });
  const paginationStatus = element('output', { 'aria-live': 'polite' }, `Página ${pagination.page} de ${pagination.pageCount}`);
  const previousPage = button('Anterior', () => { pagination.previous(); renderPagination(); });
  const nextPage = button('Próxima', () => { pagination.next(); renderPagination(); });
  function renderPagination() { previousPage.disabled = !pagination.canPrevious; nextPage.disabled = !pagination.canNext; paginationStatus.textContent = `Página ${pagination.page} de ${pagination.pageCount}`; }
  renderPagination();
  paginationPanel.append(previousPage, paginationStatus, nextPage);

  const progressPanel = panel('14. Progress', 'Barra de progresso pode ser indeterminada (sem aria-valuenow) ou determinada.');
  const progress = element('div', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '62', 'aria-label': 'Progresso de upload', style: 'height:.75rem;background:linear-gradient(90deg,#2563eb 62%,#e2e8f0 62%);border-radius:999px' });
  progressPanel.append(progress, element('p', {}, '62% concluído'));

  // Inspetor ARIA e análise automatizada.
  const inspectorPanel = panel(
    'Inspetor ARIA + axe-core',
    'Inspeciona atributos do elemento focado e executa uma auditoria da página.',
  );
  const inspector = element('pre', {
    class: 'inspector',
    'aria-live': 'polite',
  }, 'Foque um componente para inspecionar seus atributos.');
  const inspectButton = button('Inspecionar foco atual', () => {
    const active = document.activeElement;
    inspector.textContent = active instanceof HTMLElement
      ? `${active.tagName.toLowerCase()}\n${[...active.attributes]
          .map((attribute) => `${attribute.name}="${attribute.value}"`)
          .join('\n')}`
      : 'Nenhum elemento HTML ativo.';
  });
  inspectorPanel.append(inspectButton, inspector);

  // Tokens, teclado e paleta.
  const tokensPanel = panel(
    'Visualizador de tokens',
    'Valores abaixo vêm de CSS custom properties definidas pelo tema selecionado.',
  );
  const tokensTarget = element('div');
  tokensTarget.id = 'tokens';
  tokensPanel.append(tokensTarget);
  renderTokenVisualizer(tokensTarget);

  const matrixPanel = panel(
    'Matriz de teclado LTR / RTL',
    'Atalhos esperados por componente; regras direcionais horizontais são espelhadas em RTL.',
  );
  const matrixTarget = element('div');
  matrixPanel.append(matrixTarget);
  renderKeyboardMatrix(matrixTarget, direction);

  const colorsPanel = panel(
    'Paleta semântica',
    'Tokens de referência não são aplicados automaticamente aos componentes.',
  );
  colorsPanel.append(element('p', {},
    `Texto claro: ${semanticColors.light.text}; superfície escura: ${semanticColors.dark.surface}.`,
  ));

  grid.append(
    buttonPanel,
    dialogPanel,
    menuPanel,
    tabsPanel,
    tooltipPanel,
    selectPanel,
    toastPanel,
    accordionPanel,
    inspectorPanel,
    tokensPanel,
    matrixPanel,
    colorsPanel,
    checkboxPanel,
    switchPanel,
    sliderPanel,
    comboPanel,
    paginationPanel,
    progressPanel,
  );
  app.append(grid);
}

async function runAudit(): Promise<void> {
  const auditButton = toolbar.querySelector('button');
  if (auditButton) {
    auditButton.disabled = true;
    auditButton.textContent = 'Auditando…';
  }

  try {
    const result = await auditAccessibility(document.body, { exclude: ['.inspector'] });
    const summary = result.violations.length
      ? result.violations.map((item) => `${item.id}: ${item.help}`).join('\n')
      : 'Nenhuma violação axe-core identificada neste instante.';
    toastStore.add({
      title: `axe-core: ${result.violations.length} violações`,
      description: summary.slice(0, 450),
      tone: result.violations.length ? 'error' : 'success',
      duration: 0,
    });
  } catch (error) {
    toastStore.add({
      title: 'Falha na auditoria',
      description: error instanceof Error ? error.message : String(error),
      tone: 'error',
      duration: 0,
    });
  } finally {
    if (auditButton) {
      auditButton.disabled = false;
      auditButton.textContent = 'Executar auditoria axe-core';
    }
  }
}

buildToolbar();
buildPlayground();
window.addEventListener('beforeunload', () => {
  clearPlayground();
  activeThemeCleanup();
});

export { buildPlayground, buildToolbar, runAudit };
