import { LitElement, css, html } from 'lit';
import {
  createAccordionController,
  createCheckboxController,
  createRadioGroupController,
  createSliderController,
} from '@forma-ui/core';

class FormaCheckboxExample extends LitElement {
  static override styles = css`:host{display:block}.line{display:flex;gap:.65rem;align-items:center}input{inline-size:1.1rem;block-size:1.1rem}`;
  private checked: boolean | 'indeterminate' = 'indeterminate';
  private controller = createCheckboxController({
    defaultChecked: 'indeterminate',
    onCheckedChange: (next) => { this.checked = next; this.requestUpdate(); },
  });
  override updated() {
    const input = this.renderRoot.querySelector<HTMLInputElement>('input');
    this.controller.syncInput(input);
  }
  override render() {
    const props = this.controller.getInputProps();
    return html`<label class="line">
      <input type="checkbox" .checked=${props.checked} ?disabled=${props.disabled}
        aria-checked=${String(props['aria-checked'])}
        @click=${props.onClick}
        @change=${props.onChange} />
      <span>Selecionar todos os relatórios</span>
    </label>
    <p aria-live="polite">Estado: ${String(this.checked)}</p>`;
  }
}

class FormaRadioGroupExample extends LitElement {
  static override styles = css`:host{display:block}.options{display:grid;gap:.5rem;max-width:20rem}.options button{justify-self:start;padding:.45rem .7rem}.options button[aria-checked=true]{outline:2px solid var(--forma-accent,#2563eb);font-weight:700}`;
  private value = 'standard';
  private controller = createRadioGroupController({
    defaultValue: 'standard',
    orientation: 'vertical',
    onValueChange: (value) => { this.value = value; this.requestUpdate(); },
  });
  override updated() {
    for (const button of this.renderRoot.querySelectorAll<HTMLButtonElement>('[data-value]')) {
      const value = button.dataset['value'];
      if (value) this.controller.register({ value, element: button, textValue: button.textContent ?? value });
    }
  }
  override render() {
    const root = this.controller.getRootProps();
    const choices = [{ value: 'standard', label: 'Padrão' }, { value: 'compact', label: 'Compacto' }, { value: 'comfortable', label: 'Confortável' }];
    return html`<div class="options" role=${root.role} aria-orientation=${root['aria-orientation']} @keydown=${root.onKeyDown}>
      ${choices.map((choice) => {
        const props = this.controller.getItemProps(choice.value);
        return html`<button type="button" data-value=${choice.value} role="radio"
          aria-checked=${String(props['aria-checked'])} aria-disabled=${String(Boolean(props['aria-disabled']))}
          tabindex=${props.tabIndex} @click=${props.onClick}>${choice.label}</button>`;
      })}
    </div><p aria-live="polite">Densidade selecionada: ${this.value}</p>`;
  }
}

class FormaAccordionExample extends LitElement {
  static override styles = css`:host{display:block;max-width:38rem}.item{border-block-end:1px solid #94a3b8;padding-block:.6rem}.item button{inline-size:100%;text-align:start;padding:.5rem;background:transparent;border:0;font:inherit;cursor:pointer}.panel{padding:.5rem 1rem}`;
  private controller = createAccordionController({ multiple: true, defaultValue: ['principles'] });
  private items = [
    { value: 'principles', title: 'Princípios', body: 'O core mantém comportamento e acessibilidade fora da camada visual.' },
    { value: 'integration', title: 'Integração', body: 'Cada framework conecta o controlador ao seu próprio ciclo de vida.' },
    { value: 'testing', title: 'Testes', body: 'Testes de unidade, navegador e avaliação manual verificam aspectos diferentes.' },
  ];
  override render() {
    return html`${this.items.map((item) => {
      this.controller.register(item.value);
      const props = this.controller.getItemProps(item.value);
      return html`<section class="item">
        <h3><button type="button" id=${item.value} aria-expanded=${String(props['aria-expanded'])}
          aria-controls=${props['aria-controls']} @click=${() => { this.controller.toggle(item.value); this.requestUpdate(); }}>
          ${item.title}
        </button></h3>
        <div class="panel" id=${props['aria-controls']} ?hidden=${!props['aria-expanded']}>
          ${item.body}
        </div>
      </section>`;
    })}`;
  }
}

class FormaSliderExample extends LitElement {
  static override styles = css`:host{display:block;max-width:30rem}.slider{display:flex;align-items:center;gap:1rem}.slider [role=slider]{inline-size:1.25rem;block-size:1.25rem;border-radius:50%;background:#2563eb;cursor:ew-resize;outline-offset:4px}.track{height:.35rem;background:#cbd5e1;flex:1;border-radius:1rem}`;
  private value = 35;
  private controller = createSliderController({ min: 0, max: 100, step: 5, defaultValue: 35, onValueChange: (value) => { this.value = Array.isArray(value) ? value[0] ?? 0 : value; this.requestUpdate(); } });
  override render() {
    const props = this.controller.getThumbProps(0);
    return html`<div class="slider" aria-label="Volume">
      <span>0</span><div class="track" aria-hidden="true"></div>
      <div role=${props.role} tabindex=${props.tabIndex} aria-label="Volume" aria-valuemin=${props['aria-valuemin']}
        aria-valuemax=${props['aria-valuemax']} aria-valuenow=${props['aria-valuenow']}
        aria-valuetext=${`${this.value}%`} @keydown=${(event: KeyboardEvent) => props.onKeyDown(event)}></div>
      <span>100</span>
    </div><p aria-live="polite">Volume: ${this.value}%</p>`;
  }
}

for (const [tag, constructor] of [
  ['forma-checkbox-example', FormaCheckboxExample],
  ['forma-radio-group-example', FormaRadioGroupExample],
  ['forma-accordion-example', FormaAccordionExample],
  ['forma-slider-example', FormaSliderExample],
] as const) if (!customElements.get(tag)) customElements.define(tag, constructor);

export default { title: 'Forma UI/Forms and controls', parameters: { layout: 'padded' } };
export const Checkbox = { render: () => html`<h2>Checkbox</h2><p>O estado indeterminado é sincronizado pela propriedade DOM nativa.</p><forma-checkbox-example></forma-checkbox-example>` };
export const RadioGroup = { render: () => html`<h2>Radio Group</h2><p>Use as setas para mover o foco e ativar uma opção.</p><forma-radio-group-example></forma-radio-group-example>` };
export const Accordion = { render: () => html`<h2>Accordion</h2><p>Exemplo de expansão múltipla e vínculos entre botão e painel.</p><forma-accordion-example></forma-accordion-example>` };
export const Slider = { render: () => html`<h2>Slider</h2><p>Foco no thumb; use as setas, Home, End e Page Up/Down.</p><forma-slider-example></forma-slider-example>` };
