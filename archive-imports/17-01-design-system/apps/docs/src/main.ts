import { renderTokenTable } from './token-visualizer.js';
import { renderKeyboardMatrixSection } from './keyboard-matrix.js';
import { defaultTokens } from '@forma-ui/tokens';
import {
  getButtonProps,
  createDialogMachine,
  createMenuMachine,
  createTabsMachine,
  createTooltipMachine,
  createSelectMachine,
  createToastStore,
  createAccordionMachine,
  createI18nManager,
  type Direction
} from '@forma-ui/core';
import {
  lightTheme,
  darkTheme,
  highContrastTheme,
  applyTheme,
  generateBaseComponentCss,
  type FormaTheme
} from '@forma-ui/themes';
import { runAxeAudit } from '@forma-ui/a11y-testing';

type ThemeSelection = 'unstyled' | 'light' | 'dark' | 'high-contrast';

const THEMES: Record<Exclude<ThemeSelection, 'unstyled'>, FormaTheme> = {
  light: lightTheme,
  dark: darkTheme,
  'high-contrast': highContrastTheme
};

function applyProps(el: HTMLElement, props: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;

    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, value as EventListener);
      continue;
    }

    if (key === 'tabIndex' && typeof value === 'number') {
      el.tabIndex = value;
      continue;
    }

    if (key === 'disabled' && typeof value === 'boolean') {
      (el as HTMLButtonElement).disabled = value;
      continue;
    }

    if (key === 'hidden' && typeof value === 'boolean') {
      el.hidden = value;
      continue;
    }

    if (value === true) {
      el.setAttribute(key, 'true');
    } else {
      el.setAttribute(key, String(value));
    }
  }
}

function createSection(id: string, title: string, description: string): HTMLElement {
  const section = document.createElement('section');
  section.id = `demo-${id}`;
  section.setAttribute('aria-labelledby', `heading-${id}`);
  section.style.marginBlock = '1.5rem';
  section.style.padding = '1rem';
  section.style.border = '1px solid currentColor';
  section.style.borderRadius = '0.5rem';

  const heading = document.createElement('h2');
  heading.id = `heading-${id}`;
  heading.textContent = title;

  const desc = document.createElement('p');
  desc.textContent = description;

  section.append(heading, desc);
  return section;
}

export interface DocsAppController {
  setTheme: (theme: ThemeSelection) => void;
  setLocale: (locale: string) => void;
  runAudit: () => Promise<number>;
  destroy: () => void;
}

export function initDocsApp(doc: Document = document): DocsAppController {
  const root = doc.getElementById('playground-root');
  const inspector = doc.getElementById('a11y-inspector');
  const themeSwitcher = doc.getElementById('theme-switcher') as HTMLSelectElement | null;
  const localeSwitcher = doc.getElementById('locale-switcher') as HTMLSelectElement | null;
  const auditButton = doc.getElementById('run-a11y-audit') as HTMLButtonElement | null;

  if (!root) {
    throw new Error('Elemento #playground-root não encontrado no DOM.');
  }

  const i18n = createI18nManager('pt-BR');
  let cleanupTheme: (() => void) | null = null;
  let styleTag: HTMLStyleElement | null = null;
  const cleanups: Array<() => void> = [];

  const ensureOptionalThemeCss = (enabled: boolean) => {
    if (enabled) {
      if (!styleTag) {
        styleTag = doc.createElement('style');
        styleTag.id = 'forma-optional-theme-css';
        styleTag.textContent = generateBaseComponentCss();
        doc.head.appendChild(styleTag);
      }
    } else if (styleTag) {
      styleTag.remove();
      styleTag = null;
    }
  };

  const setTheme = (selection: ThemeSelection) => {
    cleanupTheme?.();
    cleanupTheme = null;

    if (selection === 'unstyled') {
      ensureOptionalThemeCss(false);
      doc.documentElement.removeAttribute('style');
      return;
    }

    ensureOptionalThemeCss(true);
    cleanupTheme = applyTheme(THEMES[selection], doc.documentElement);
  };

  const renderInspectorStatus = (summary: string, details: string[] = []) => {
    if (!inspector) return;
    inspector.innerHTML = '';
    const title = doc.createElement('h2');
    title.textContent = 'Inspetor ARIA & Acessibilidade';

    const status = doc.createElement('p');
    status.textContent = summary;
    inspector.append(title, status);

    if (details.length > 0) {
      const list = doc.createElement('ul');
      for (const item of details) {
        const li = doc.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      }
      inspector.appendChild(list);
    }
  };

  const renderPlayground = () => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    root.innerHTML = '';

    const { dir, locale } = i18n.getState();
    doc.documentElement.dir = dir;
    doc.documentElement.lang = locale;

    /* 1. Button Demo */
    const buttonSection = createSection(
      'button',
      '1. Button (Nativo, Toggle e Loading)',
      'Gerencia aria-pressed, aria-busy e bloqueia disparos duplicados sem remover o foco.'
    );
    let pressed = false;
    const toggleBtn = doc.createElement('button');
    const renderToggleBtn = () => {
      const clone = doc.createElement('button');
      clone.textContent = pressed ? 'Favoritado (aria-pressed="true")' : 'Favoritar (aria-pressed="false")';
      applyProps(
        clone,
        getButtonProps({
          pressed,
          onPress: () => {
            pressed = !pressed;
            renderToggleBtn();
          }
        }) as unknown as Record<string, unknown>
      );
      toggleBtn.replaceWith(clone);
      Object.assign(toggleBtn, clone);
    };
    toggleBtn.textContent = 'Favoritar (aria-pressed="false")';
    applyProps(
      toggleBtn,
      getButtonProps({
        pressed,
        onPress: () => {
          pressed = !pressed;
          toggleBtn.setAttribute('aria-pressed', String(pressed));
          toggleBtn.textContent = pressed
            ? 'Favoritado (aria-pressed="true")'
            : 'Favoritar (aria-pressed="false")';
        }
      }) as unknown as Record<string, unknown>
    );

    const loadingBtn = doc.createElement('button');
    loadingBtn.textContent = 'Salvar (Loading / aria-busy)';
    applyProps(
      loadingBtn,
      getButtonProps({ loading: true }) as unknown as Record<string, unknown>
    );

    buttonSection.append(toggleBtn, ' ', loadingBtn);
    root.appendChild(buttonSection);

    /* 2. Dialog Demo */
    const dialogSection = createSection(
      'dialog',
      '2. Dialog Modal (Focus Trap + Escape + Restauração de Foco)',
      'Isola a navegação por Tab/Shift+Tab dentro do modal e devolve o foco ao gatilho ao fechar.'
    );
    const dialog = createDialogMachine({
      id: 'docs-dialog',
      modal: true,
      dir,
      closeLabel: i18n.t('dialog.close')
    });

    const dialogTrigger = doc.createElement('button');
    dialogTrigger.textContent = 'Abrir Dialog Modal';
    applyProps(dialogTrigger, dialog.getTriggerProps() as unknown as Record<string, unknown>);

    const dialogHost = doc.createElement('div');
    let unmountDialogContent: (() => void) | null = null;

    const syncDialog = () => {
      const state = dialog.getState();
      dialogTrigger.setAttribute('aria-expanded', String(state.open));
      unmountDialogContent?.();
      unmountDialogContent = null;
      dialogHost.innerHTML = '';

      if (!state.open) return;

      const overlay = doc.createElement('div');
      applyProps(overlay, dialog.getOverlayProps() as unknown as Record<string, unknown>);

      const content = doc.createElement('div');
      applyProps(content, dialog.getContentProps() as unknown as Record<string, unknown>);

      const title = doc.createElement('h3');
      title.textContent = 'Confirmar Publicação';
      applyProps(title, dialog.getTitleProps() as unknown as Record<string, unknown>);

      const desc = doc.createElement('p');
      desc.textContent = 'Pressione Tab para testar o Focus Trap ou Escape para fechar.';
      applyProps(desc, dialog.getDescriptionProps() as unknown as Record<string, unknown>);

      const closeBtn = doc.createElement('button');
      closeBtn.textContent = i18n.t('dialog.close');
      applyProps(closeBtn, dialog.getCloseProps() as unknown as Record<string, unknown>);

      content.append(title, desc, closeBtn);
      dialogHost.append(overlay, content);
      unmountDialogContent = dialog.mountContent(content);
    };

    const unsubDialog = dialog.subscribe(syncDialog);
    cleanups.push(() => {
      unmountDialogContent?.();
      unsubDialog();
      dialog.destroy();
    });
    dialogSection.append(dialogTrigger, dialogHost);
    root.appendChild(dialogSection);

    /* 3. Menu Demo */
    const menuSection = createSection(
      'menu',
      '3. Menu (Setas + Typeahead + ARIA)',
      'Suporta navegação por teclado, busca por inicial e itens desabilitados.'
    );
    const menuItems = [
      { id: 'new', label: 'Novo Arquivo' },
      { id: 'export', label: 'Exportar Tokens JSON' },
      { id: 'archive', label: 'Arquivar (Desabilitado)', disabled: true },
      { id: 'audit', label: 'Executar Auditoria' }
    ];
    const menu = createMenuMachine({
      id: 'docs-menu',
      items: menuItems,
      dir,
      ariaLabel: i18n.t('menu.label'),
      onSelectItem: (itemId) => {
        renderInspectorStatus(`Item de menu selecionado: "${itemId}"`);
      }
    });

    const menuTrigger = doc.createElement('button');
    menuTrigger.textContent = i18n.t('menu.label');
    applyProps(menuTrigger, menu.getTriggerProps() as unknown as Record<string, unknown>);

    const menuList = doc.createElement('div');
    const syncMenu = () => {
      const state = menu.getState();
      menuTrigger.setAttribute('aria-expanded', String(state.open));
      menuList.innerHTML = '';
      menuList.hidden = !state.open;
      if (!state.open) return;

      const listEl = doc.createElement('div');
      applyProps(listEl, menu.getMenuProps() as unknown as Record<string, unknown>);
      menuItems.forEach((item, index) => {
        const itemEl = doc.createElement('div');
        itemEl.textContent = item.label;
        applyProps(itemEl, menu.getItemProps(item, index) as unknown as Record<string, unknown>);
        listEl.appendChild(itemEl);
      });
      menuList.appendChild(listEl);
      listEl.focus();
    };
    syncMenu();
    const unsubMenu = menu.subscribe(syncMenu);
    cleanups.push(unsubMenu);
    menuSection.append(menuTrigger, menuList);
    root.appendChild(menuSection);

    /* 4. Tabs Demo */
    const tabsSection = createSection(
      'tabs',
      '4. Tabs (Roving Tabindex + Espelhamento RTL)',
      'Alterne o idioma para Árabe (ar-SA) para observar ArrowLeft/ArrowRight espelhados.'
    );
    const tabDefs = [
      { value: 'tokens', label: 'Tokens', content: `Total de espaçamentos: ${Object.keys(defaultTokens.spacing).length} escalas.` },
      { value: 'aria', label: 'WAI-ARIA', content: 'Roles nativos, roving tabindex e gerenciamento de foco.' },
      { value: 'frameworks', label: 'Multi-Framework', content: 'Adaptadores para React, Vue e Svelte sobre @forma-ui/core.' }
    ];
    const tabs = createTabsMachine({
      id: 'docs-tabs',
      items: tabDefs.map((t) => ({ value: t.value })),
      defaultValue: 'tokens',
      dir,
      ariaLabel: 'Documentação da Arquitetura'
    });

    const tabsContainer = doc.createElement('div');
    const renderTabs = () => {
      tabsContainer.innerHTML = '';
      const tabList = doc.createElement('div');
      applyProps(tabList, tabs.getTabListProps() as unknown as Record<string, unknown>);

      for (const tab of tabDefs) {
        const btn = doc.createElement('button');
        btn.textContent = tab.label;
        const tp = tabs.getTabProps(tab.value, (nextId) => doc.getElementById(nextId)?.focus());
        applyProps(btn, tp as unknown as Record<string, unknown>);
        tabList.appendChild(btn);
      }

      tabsContainer.appendChild(tabList);

      for (const tab of tabDefs) {
        const panel = doc.createElement('div');
        panel.textContent = tab.content;
        applyProps(panel, tabs.getPanelProps(tab.value) as unknown as Record<string, unknown>);
        tabsContainer.appendChild(panel);
      }
    };
    renderTabs();
    const unsubTabs = tabs.subscribe(renderTabs);
    cleanups.push(unsubTabs);
    tabsSection.appendChild(tabsContainer);
    root.appendChild(tabsSection);

    /* 5. Tooltip Demo */
    const tooltipSection = createSection(
      'tooltip',
      '5. Tooltip (aria-describedby + Escape)',
      'Exibe dica acessível no hover ou foco e fecha imediatamente ao pressionar Escape.'
    );
    const tooltip = createTooltipMachine({ id: 'docs-tooltip', dir, openDelay: 150 });
    const tipTrigger = doc.createElement('button');
    tipTrigger.textContent = 'Passe o mouse ou foque aqui';
    const tipBubble = doc.createElement('div');
    tipBubble.textContent = 'Dica acessível vinculada via aria-describedby.';

    const syncTooltip = () => {
      const open = tooltip.getState().open;
      if (open) {
        tipTrigger.setAttribute('aria-describedby', tooltip.ids.tooltip);
      } else {
        tipTrigger.removeAttribute('aria-describedby');
      }
      tipBubble.hidden = !open;
      tipBubble.setAttribute('data-state', open ? 'open' : 'closed');
    };
    applyProps(tipTrigger, tooltip.getTriggerProps() as unknown as Record<string, unknown>);
    applyProps(tipBubble, tooltip.getTooltipProps() as unknown as Record<string, unknown>);
    syncTooltip();
    const unsubTooltip = tooltip.subscribe(syncTooltip);
    cleanups.push(() => {
      unsubTooltip();
      tooltip.destroy();
    });
    tooltipSection.append(tipTrigger, ' ', tipBubble);
    root.appendChild(tooltipSection);

    /* 6. Select Demo */
    const selectSection = createSection(
      'select',
      '6. Select (Combobox/Listbox + Typeahead)',
      'Suporta seleção por teclado, busca por texto digitado e sincronização de formulário.'
    );
    const selectOptions = [
      { value: 'react', label: 'React 18/19 (@forma-ui/react)' },
      { value: 'vue', label: 'Vue 3 (@forma-ui/vue)' },
      { value: 'svelte', label: 'Svelte 4/5 (@forma-ui/svelte)' }
    ];
    const select = createSelectMachine({
      id: 'docs-select',
      options: selectOptions,
      placeholder: i18n.t('select.placeholder'),
      ariaLabel: 'Selecionar adaptador de framework',
      dir
    });

    const selectTrigger = doc.createElement('button');
    const selectListWrap = doc.createElement('div');

    const syncSelect = () => {
      const state = select.getState();
      selectTrigger.textContent = select.getDisplayText();
      selectTrigger.setAttribute('aria-expanded', String(state.open));
      selectListWrap.innerHTML = '';
      if (!state.open) return;

      const listbox = doc.createElement('div');
      applyProps(listbox, select.getListboxProps() as unknown as Record<string, unknown>);
      selectOptions.forEach((opt, idx) => {
        const optEl = doc.createElement('div');
        optEl.textContent = opt.label;
        applyProps(optEl, select.getOptionProps(opt, idx) as unknown as Record<string, unknown>);
        listbox.appendChild(optEl);
      });
      selectListWrap.appendChild(listbox);
    };
    applyProps(selectTrigger, select.getTriggerProps() as unknown as Record<string, unknown>);
    syncSelect();
    const unsubSelect = select.subscribe(syncSelect);
    cleanups.push(unsubSelect);
    selectSection.append(selectTrigger, selectListWrap);
    root.appendChild(selectSection);

    /* 7. Toast Demo */
    const toastSection = createSection(
      'toast',
      '7. Toast (Live Regions + Timers Pausáveis WCAG 2.2.1)',
      'Pausa a contagem regressiva automaticamente ao passar o cursor ou focar a notificação.'
    );
    const toastStore = createToastStore({
      dir,
      regionLabel: i18n.t('toast.regionLabel'),
      closeLabel: i18n.t('toast.close')
    });

    const notifySuccessBtn = doc.createElement('button');
    notifySuccessBtn.type = 'button';
    notifySuccessBtn.textContent = 'Disparar Toast Polite (Sucesso)';
    notifySuccessBtn.addEventListener('click', () => {
      toastStore.success('Tokens exportados', 'Arquivo W3C tokens.json atualizado.');
    });

    const notifyErrorBtn = doc.createElement('button');
    notifyErrorBtn.type = 'button';
    notifyErrorBtn.textContent = 'Disparar Toast Assertive (Alerta)';
    notifyErrorBtn.addEventListener('click', () => {
      toastStore.error('Falha de validação', 'Verifique o contraste mínimo WCAG AA.');
    });

    const toastRegion = doc.createElement('div');
    applyProps(toastRegion, toastStore.getRegionProps() as unknown as Record<string, unknown>);

    const syncToasts = () => {
      toastRegion.innerHTML = '';
      for (const item of toastStore.getToasts()) {
        const card = doc.createElement('div');
        applyProps(card, toastStore.getToastProps(item) as unknown as Record<string, unknown>);

        const title = doc.createElement('strong');
        title.textContent = item.title;

        const closeBtn = doc.createElement('button');
        closeBtn.textContent = '×';
        applyProps(
          closeBtn,
          toastStore.getCloseButtonProps(item.id) as unknown as Record<string, unknown>
        );

        card.append(title, ' ');
        if (item.description) {
          const desc = doc.createElement('span');
          desc.textContent = item.description;
          card.append(desc, ' ');
        }
        card.appendChild(closeBtn);
        toastRegion.appendChild(card);
      }
    };
    const unsubToast = toastStore.subscribe(syncToasts);
    cleanups.push(() => {
      unsubToast();
      toastStore.dismissAll();
    });
    toastSection.append(notifySuccessBtn, ' ', notifyErrorBtn, toastRegion);
    root.appendChild(toastSection);

    /* 8. Accordion Demo */
    const accordionSection = createSection(
      'accordion',
      '8. Accordion (Single/Multiple + Navegação por Setas)',
      'Cabeçalhos semânticos com aria-expanded, aria-controls e painéis role="region".'
    );
    const accItems = [
      {
        value: 'headless',
        title: 'Por que uma arquitetura Headless?',
        content: 'Separa comportamento, máquina de estados e WAI-ARIA da camada de apresentação.'
      },
      {
        value: 'treesake',
        title: 'Como funciona o Tree-Shaking?',
        content: 'Cada componente possui entry point dedicado (@forma-ui/core/dialog, /select, etc.).'
      }
    ];
    const accordion = createAccordionMachine({
      id: 'docs-accordion',
      type: 'single',
      collapsible: true,
      defaultValue: ['headless'],
      items: accItems.map((i) => ({ value: i.value })),
      dir
    });

    const accRoot = doc.createElement('div');
    applyProps(accRoot, accordion.getRootProps() as unknown as Record<string, unknown>);

    const renderAccordion = () => {
      accRoot.innerHTML = '';
      for (const item of accItems) {
        const itemWrap = doc.createElement('div');
        applyProps(itemWrap, accordion.getItemProps(item.value) as unknown as Record<string, unknown>);

        const h3 = doc.createElement('h3');
        const trigger = doc.createElement('button');
        trigger.textContent = item.title;
        applyProps(
          trigger,
          accordion.getTriggerProps(item.value, (nextId) => doc.getElementById(nextId)?.focus()) as unknown as Record<string, unknown>
        );
        h3.appendChild(trigger);

        const panel = doc.createElement('div');
        panel.textContent = item.content;
        applyProps(panel, accordion.getPanelProps(item.value) as unknown as Record<string, unknown>);

        itemWrap.append(h3, panel);
        accRoot.appendChild(itemWrap);
      }
    };
    renderAccordion();
    const unsubAcc = accordion.subscribe(renderAccordion);
    cleanups.push(unsubAcc);
    accordionSection.appendChild(accRoot);
    root.appendChild(accordionSection);

    /* 9. Token Visualizer & WCAG Contrast Matrix */
    root.appendChild(renderTokenTable(doc));

    /* 10. WAI-ARIA Keyboard Matrix (LTR vs RTL) */
    root.appendChild(renderKeyboardMatrixSection(doc));
  };

  const runAudit = async (): Promise<number> => {
    const results = await runAxeAudit(root);
    if (results.violations.length === 0) {
      renderInspectorStatus(
        `Auditoria axe-core concluída: 0 violações WAI-ARIA/WCAG (${results.passes.length} regras aprovadas).`
      );
    } else {
      renderInspectorStatus(
        `Auditoria axe-core detectou ${results.violations.length} violação(ões):`,
        results.violations.map((v) => `[${v.id}] ${v.help}`)
      );
    }
    return results.violations.length;
  };

  themeSwitcher?.addEventListener('change', () => {
    setTheme(themeSwitcher.value as ThemeSelection);
  });

  localeSwitcher?.addEventListener('change', () => {
    i18n.setLocale(localeSwitcher.value);
    renderPlayground();
  });

  auditButton?.addEventListener('click', () => {
    void runAudit();
  });

  const handleFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || !root.contains(target)) return;
    const role = target.getAttribute('role') ?? target.tagName.toLowerCase();
    const ariaAttrs = Array.from(target.attributes)
      .filter((a) => a.name.startsWith('aria-') || a.name.startsWith('data-forma-'))
      .map((a) => `${a.name}="${a.value}"`)
      .join(', ');
    renderInspectorStatus(`Foco ativo: <${target.tagName.toLowerCase()}> (role="${role}")`, [
      ariaAttrs || 'Sem atributos ARIA adicionais'
    ]);
  };
  doc.addEventListener('focusin', handleFocusIn);

  setTheme((themeSwitcher?.value as ThemeSelection) ?? 'light');
  renderPlayground();
  renderInspectorStatus('Pronto. Interaja com os 8 componentes ou execute a auditoria axe-core.');

  return {
    setTheme,
    setLocale: (locale: string) => {
      i18n.setLocale(locale);
      renderPlayground();
    },
    runAudit,
    destroy: () => {
      doc.removeEventListener('focusin', handleFocusIn);
      while (cleanups.length > 0) cleanups.pop()?.();
      cleanupTheme?.();
      ensureOptionalThemeCss(false);
    }
  };
}

if (typeof document !== 'undefined' && document.getElementById('playground-root')) {
  initDocsApp(document);
}
