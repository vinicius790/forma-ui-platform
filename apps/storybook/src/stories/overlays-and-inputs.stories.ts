import { LitElement, css, html } from 'lit';
import {
  createEditableController,
  createPopoverController,
  createSegmentGroupController,
  createStepperController,
  createTagsInputController,
} from '@forma-ui/core';

class FormaV10ShowcaseStory extends LitElement {
  static override styles = css`
    :host { display: grid; gap: 1.25rem; font-family: system-ui, sans-serif; }
    section { border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 1rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    [data-state="open"], [data-state="checked"], [aria-current="step"] { font-weight: 600; outline: 2px solid #2563eb; }
  `;

  private popover = createPopoverController({ id: 'story-popover', onOpenChange: () => this.requestUpdate() });
  private stepper = createStepperController({ id: 'story-stepper', count: 3, onStepChange: () => this.requestUpdate() });
  private tags = createTagsInputController({ id: 'story-tags', defaultValue: ['headless', 'wcag-2.2'], onValueChange: () => this.requestUpdate() });
  private editable = createEditableController({ id: 'story-editable', defaultValue: 'Forma UI 10.0.0', onValueChange: () => this.requestUpdate(), onEditChange: () => this.requestUpdate() });
  private segment = createSegmentGroupController({
    id: 'story-segment',
    items: [{ value: 'list' }, { value: 'board' }, { value: 'timeline' }],
    defaultValue: 'list',
    onValueChange: () => this.requestUpdate(),
  });

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.popover.destroy();
    this.stepper.destroy();
    this.tags.destroy();
    this.editable.destroy();
    this.segment.destroy();
  }

  override render() {
    const popTrigger = this.popover.getTriggerProps();
    const popContent = this.popover.getContentProps();
    const editPreview = this.editable.getPreviewProps();
    const editInput = this.editable.getInputProps();
    return html`
      <section>
        <h3>Popover (v10)</h3>
        <button type="button" aria-expanded=${String(popTrigger['aria-expanded'])} aria-controls=${popTrigger['aria-controls']} @click=${popTrigger.onClick}>Toggle Popover</button>
        <div id=${popContent.id} role=${popContent.role} ?hidden=${popContent.hidden}>Headless Popover content</div>
      </section>
      <section>
        <h3>Stepper (v10) — Step ${this.stepper.step + 1} / 3</h3>
        <div class="row">
          ${[0, 1, 2].map((i) => {
            const p = this.stepper.getStepTriggerProps(i);
            return html`<button type="button" aria-current=${p['aria-current'] ?? ''} @click=${p.onClick}>Step ${i + 1}</button>`;
          })}
        </div>
      </section>
      <section>
        <h3>TagsInput (v10)</h3>
        <div class="row" role="list" aria-label="Tags">
          ${this.tags.tags.map((tag, i) => html`<span role="listitem">${tag} <button type="button" aria-label=${`Remove ${tag}`} @click=${() => this.tags.removeTag(i)}>×</button></span>`)}
        </div>
      </section>
      <section>
        <h3>Editable (v10)</h3>
        <span ?hidden=${editPreview.hidden} tabindex="0" @click=${editPreview.onClick}>${this.editable.value}</span>
        <input ?hidden=${editInput.hidden} .value=${editInput.value} @input=${editInput.onInput} @keydown=${editInput.onKeyDown} @blur=${editInput.onBlur} />
      </section>
      <section>
        <h3>SegmentGroup (v10): ${this.segment.value}</h3>
        <div class="row" role="radiogroup" aria-label="View mode">
          ${['list', 'board', 'timeline'].map((val) => {
            const p = this.segment.getItemProps(val);
            return html`<button type="button" role="radio" aria-checked=${String(p['aria-checked'])} data-state=${p['data-state']} @click=${p.onClick} @keydown=${p.onKeyDown}>${val}</button>`;
          })}
        </div>
      </section>
    `;
  }
}

if (!customElements.get('forma-v10-showcase-story')) {
  customElements.define('forma-v10-showcase-story', FormaV10ShowcaseStory);
}

export default { title: 'Forma UI 10.0/Showcase' };
export const EnterpriseControllers = () => html`<forma-v10-showcase-story></forma-v10-showcase-story>`;
