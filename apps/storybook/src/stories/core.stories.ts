import { LitElement, css, html, nothing } from 'lit';
import { createDialogController, createListboxController, createNumberFieldController, createPinInputController, createSwitchController, createTabsController, createTreeViewController } from '@forma-ui/core';

class FormaSwitchStory extends LitElement {
  static override styles = css`:host{display:block}.row{display:flex;align-items:center;gap:1rem}`;
  private checked = false;
  private controller = createSwitchController({
    defaultChecked: false,
    onCheckedChange: (checked) => {
      this.checked = checked;
      this.requestUpdate();
    },
  });

  override render() {
    const props = this.controller.getButtonProps();
    return html`<div class="row">
      <button type="button" role="switch" aria-checked=${String(this.checked)}
        aria-label="Notificações" @click=${props.onClick}>
        ${this.checked ? 'Ativado' : 'Desativado'}
      </button>
      <span aria-live="polite">Notificações ${this.checked ? 'ligadas' : 'desligadas'}</span>
    </div>`;
  }
}

class FormaTabsStory extends LitElement {
  static override styles = css`:host{display:block}.panels{padding-block:1rem}`;
  private values = [
    { value: 'overview', label: 'Visão geral', content: 'O núcleo mantém estado e regras de interação fora do framework.' },
    { value: 'accessibility', label: 'Acessibilidade', content: 'O adaptador conecta foco, teclado e semântica à árvore renderizada.' },
    { value: 'integration', label: 'Integração', content: 'O consumidor mantém o controle da aparência e do layout.' },
  ];
  private controller = createTabsController({
    defaultValue: 'overview',
    onValueChange: () => this.requestUpdate(),
  });

  override firstUpdated() {
    this.syncElements();
  }

  override updated() {
    this.syncElements();
  }

  private syncElements() {
    for (const item of this.values) {
      const element = this.renderRoot.querySelector<HTMLElement>(`#story-tab-${item.value}`);
      this.controller.register({
        value: item.value,
        id: `story-tab-${item.value}`,
        panelId: `story-panel-${item.value}`,
        element,
      });
    }
  }

  override render() {
    return html`<div role="tablist" aria-label="Forma UI capabilities">
      ${this.values.map((item) => {
        const record = { value: item.value, id: `story-tab-${item.value}`, panelId: `story-panel-${item.value}` };
        const props = this.controller.getTabProps(record);
        return html`<button id=${record.id} role="tab" aria-controls=${record.panelId}
          aria-selected=${String(props['aria-selected'])} tabindex=${props.tabIndex}
          @click=${props.onClick} @keydown=${props.onKeyDown}>${item.label}</button>`;
      })}
    </div>
    <div class="panels">
      ${this.values.map((item) => {
        const record = { value: item.value, id: `story-tab-${item.value}`, panelId: `story-panel-${item.value}` };
        const props = this.controller.getPanelProps(record);
        return html`<section id=${record.panelId} role="tabpanel" aria-labelledby=${record.id}
          ?hidden=${props.hidden} tabindex="0">${item.content}</section>`;
      })}
    </div>`;
  }
}

class FormaDialogStory extends LitElement {
  static override styles = css`:host{display:block}.actions{display:flex;gap:.75rem;flex-wrap:wrap}`;
  private open = false;
  private controller = createDialogController({
    onOpenChange: (open) => {
      this.open = open;
      this.requestUpdate();
    },
  });

  override updated() {
    const trigger = this.renderRoot.querySelector<HTMLElement>('#storybook-dialog-trigger');
    const content = this.renderRoot.querySelector<HTMLElement>('#storybook-dialog-content');
    if (trigger) this.controller.setTrigger(trigger);
    if (content) this.controller.setContent(content);
  }

  override disconnectedCallback() {
    this.controller.destroy();
    super.disconnectedCallback();
  }

  override render() {
    return html`<div class="story-stage">
      <button id="storybook-dialog-trigger" type="button" aria-haspopup="dialog"
        aria-expanded=${String(this.open)} @click=${() => this.controller.show()}>
        Abrir diálogo
      </button>
      <div class="dialog-backdrop" ?hidden=${!this.open}>
        <section id="storybook-dialog-content" role="dialog" aria-modal="true"
          aria-labelledby="storybook-dialog-title" tabindex="-1">
          <h2 id="storybook-dialog-title">Confirmação de exemplo</h2>
          <p>O diálogo demonstra foco contido, Escape e restauração do foco ao gatilho.</p>
          <div class="actions">
            <button type="button" @click=${() => this.controller.close()}>Fechar</button>
          </div>
        </section>
      </div>
    </div>`;
  }
}


class FormaListboxStory extends LitElement {
  static override styles = css`:host{display:block}.options{display:grid;gap:.25rem;max-width:18rem}.option{padding:.5rem;border:1px solid #94a3b8;border-radius:.35rem}.option[aria-selected=true]{background:#dbeafe;color:#172554}`;
  private items = [{ key: 'recife', value: 'Recife', textValue: 'Recife' }, { key: 'fortaleza', value: 'Fortaleza', textValue: 'Fortaleza' }, { key: 'salvador', value: 'Salvador', textValue: 'Salvador' }];
  private controller = createListboxController({ options: this.items, defaultValue: 'recife', onValueChange: () => this.requestUpdate() });
  override updated() {
    const rootElement = this.renderRoot.querySelector<HTMLElement>('#storybook-listbox');
    this.controller.getRootProps('Brazilian capitals').ref(rootElement);
  }
  override render() {
    const root = this.controller.getRootProps('Brazilian capitals');
    return html`<div class="options" id="storybook-listbox" role="listbox" aria-label="Capitais brasileiras" tabindex=${root.tabIndex}
      aria-activedescendant=${root['aria-activedescendant'] ?? nothing} aria-orientation=${root['aria-orientation']}
      @keydown=${(event: KeyboardEvent) => { root.onKeyDown(event); this.requestUpdate(); }}>
      ${this.items.map((item) => { const props = this.controller.getOptionProps(item.key); return html`<div class="option" id=${item.key}
        role="option" aria-selected=${String(props['aria-selected'])} aria-disabled=${String(Boolean(props['aria-disabled']))}
        tabindex=${props.tabIndex} @pointermove=${props.onPointerMove} @click=${() => { props.onClick(); this.requestUpdate(); }}>${item.value}</div>`; })}
    </div><p aria-live="polite">Selecionado: ${String(this.controller.selectedKeys[0] ?? 'nenhum')}</p>`;
  }
}

class FormaTreeStory extends LitElement {
  static override styles = css`:host{display:block}.tree-item{padding:.25rem .5rem;border-radius:.25rem}.tree-item:focus{outline:2px solid #2563eb}`;
  private controller = createTreeViewController({ nodes: [{ key: 'root', value: 'Documentos', children: [{ key: 'reports', value: 'Relatórios', children: [{ key: 'annual', value: 'Anual' }] }, { key: 'images', value: 'Imagens' }] }], defaultExpandedKeys: ['root'], selectionMode: 'single' });
  override updated() {
    for (const node of this.controller.visibleNodes) {
      const element = this.renderRoot.querySelector<HTMLElement>(`#${CSS.escape(node.key)}`);
      this.controller.registerItem(node.key, element);
    }
  }
  override render() {
    const root = this.controller.getRootProps('Arquivos');
    return html`<div role="tree" aria-label="Arquivos" @keydown=${(event: KeyboardEvent) => { root.onKeyDown(event); this.requestUpdate(); }}>
      ${this.controller.visibleNodes.map((node) => { const props = this.controller.getItemProps(node.key); return html`<div class="tree-item" id=${node.key} role="treeitem" aria-level=${node.level}
        aria-posinset=${node.posInSet} aria-setsize=${node.setSize} aria-expanded=${node.hasChildren ? String(node.expanded) : nothing}
        aria-selected=${String(Boolean(props['aria-selected']))} tabindex=${props.tabIndex} style=${`padding-inline-start:${(node.level - 1) * 1.25}rem`}
        @focus=${props.onFocus} @click=${(event: MouseEvent) => { props.onClick(event); this.requestUpdate(); }}>${String(node.value)}</div>`; })}
    </div><p>Use as setas para expandir, recolher e percorrer a árvore.</p>`;
  }
}

class FormaNumberFieldStory extends LitElement {
  static override styles = css`:host{display:block}.row{display:flex;align-items:center;gap:.5rem}.row input{max-width:7rem}`;
  private controller = createNumberFieldController({ min: 0, max: 20, step: 1, defaultValue: 5 });
  override render() {
    const props = this.controller.getInputProps();
    return html`<div class="row"><button type="button" aria-label="Diminuir" ?disabled=${this.controller.value <= 0} @click=${() => { this.controller.decrement(); this.requestUpdate(); }}>−</button>
      <input type="number" aria-label="Quantidade" .value=${String(this.controller.value)} min="0" max="20" step="1"
        @change=${(event: Event) => { const value = (event.currentTarget as HTMLInputElement).valueAsNumber; if (Number.isFinite(value)) this.controller.setValue(value); this.requestUpdate(); }}
        @keydown=${(event: KeyboardEvent) => { props.onKeyDown(event); this.requestUpdate(); }} />
      <button type="button" aria-label="Aumentar" ?disabled=${this.controller.value >= 20} @click=${() => { this.controller.increment(); this.requestUpdate(); }}>+</button></div>
      <p>Valor normalizado: ${this.controller.value}</p>`;
  }
}

class FormaPinInputStory extends LitElement {
  static override styles = css`:host{display:block}.digits{display:flex;gap:.4rem}.digits input{width:2.5rem;text-align:center;padding:.5rem}`;
  private completed = false;
  private controller = createPinInputController({ length: 4, otp: true, onValueChange: () => this.requestUpdate(), onComplete: () => { this.completed = true; this.requestUpdate(); } });
  override updated() {
    for (const [index, input] of [...this.renderRoot.querySelectorAll<HTMLInputElement>('input')].entries()) {
      this.controller.registerInput(index, input);
    }
  }
  override disconnectedCallback() {
    this.controller.destroy();
    super.disconnectedCallback();
  }
  override render() {
    return html`<div class="digits">${Array.from({ length: this.controller.length }, (_, index) => { const props = this.controller.getInputProps(index); return html`<input
      id=${props.id} type="${props.type}" inputmode="numeric" autocomplete=${props.autoComplete ?? 'off'} maxlength=${props.maxLength}
      aria-label=${props['aria-label']} .value=${String(props.value)} ?disabled=${Boolean(props.disabled)}
      @input=${(event: Event) => { props.onInput(event); this.completed = false; this.requestUpdate(); }}
      @paste=${(event: ClipboardEvent) => { props.onPaste(event); this.completed = false; this.requestUpdate(); }}
      @keydown=${(event: KeyboardEvent) => props.onKeyDown(event)} />`; })}</div>
      <p aria-live="polite">${this.completed ? 'Código completo' : `${this.controller.value.length} de ${this.controller.length} dígitos`}</p>`;
  }
}

for (const [tag, constructor] of [
  ['forma-switch-story', FormaSwitchStory],
  ['forma-tabs-story', FormaTabsStory],
  ['forma-dialog-story', FormaDialogStory],
  ['forma-listbox-story', FormaListboxStory],
  ['forma-tree-story', FormaTreeStory],
  ['forma-number-field-story', FormaNumberFieldStory],
  ['forma-pin-input-story', FormaPinInputStory],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, constructor);
}

const meta = {
  title: 'Forma UI/Core',
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;

export const Switch = {
  render: () => html`<div class="story-stage"><h2>Switch</h2><p>Estado comunicado por role=switch e aria-checked.</p><forma-switch-story></forma-switch-story></div>`,
};

export const Tabs = {
  render: () => html`<div class="story-stage"><h2>Tabs</h2><p>Use as setas, Home e End para navegar; a ativação é automática.</p><forma-tabs-story></forma-tabs-story></div>`,
};

export const Dialog = {
  render: () => html`<forma-dialog-story></forma-dialog-story>`,
};

export const NativeButton = {
  render: () => html`<div class="story-stage"><h2>Button</h2><p>Use o elemento nativo quando a semântica padrão atende ao caso de uso.</p><button type="button" @click=${(event: Event) => { (event.currentTarget as HTMLButtonElement).textContent = 'Ação executada'; }}>Executar ação</button></div>`,
};

export const AccessibleField = {
  render: () => html`<div class="story-stage">
    <label for="storybook-email">E-mail</label>
    <input id="storybook-email" type="email" autocomplete="email" aria-describedby="storybook-email-hint" />
    <p id="storybook-email-hint">Usaremos este endereço para notificações relevantes.</p>
  </div>`,
};


export const Listbox = {
  render: () => html`<div class="story-stage"><h2>Listbox</h2><p>O foco permanece no container e a opção ativa é anunciada por aria-activedescendant.</p><forma-listbox-story></forma-listbox-story></div>`,
};
export const TreeView = {
  render: () => html`<div class="story-stage"><h2>TreeView</h2><p>Expansão, recolhimento e foco hierárquico por teclado.</p><forma-tree-story></forma-tree-story></div>`,
};
export const NumberField = {
  render: () => html`<div class="story-stage"><h2>NumberField</h2><p>Valor limitado por min/max e incremento acessível.</p><forma-number-field-story></forma-number-field-story></div>`,
};
export const PinInput = {
  render: () => html`<div class="story-stage"><h2>PinInput</h2><p>Entrada OTP com suporte à colagem e indicação de conclusão.</p><forma-pin-input-story></forma-pin-input-story></div>`,
};
