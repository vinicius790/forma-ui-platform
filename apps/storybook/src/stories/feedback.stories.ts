import { LitElement, css, html } from 'lit';
import { createToastStore } from '@forma-ui/core';

class FormaToastExample extends LitElement {
  static override styles = css`:host{display:block}.actions{display:flex;gap:.5rem;flex-wrap:wrap}.toasts{display:grid;gap:.5rem;margin-block:1rem}.toast{border:1px solid #94a3b8;border-inline-start:4px solid #2563eb;border-radius:.4rem;padding:.75rem;display:flex;justify-content:space-between;gap:1rem}.toast[data-tone=success]{border-inline-start-color:#15803d}.toast[data-tone=warning]{border-inline-start-color:#b45309}.toast[data-tone=error]{border-inline-start-color:#b91c1c}`;
  private store = createToastStore({ duration: 0, max: 4 });
  private unsubscribe?: () => void;
  private count = 0;
  override connectedCallback() { super.connectedCallback(); this.unsubscribe = this.store.subscribe(() => this.requestUpdate()); }
  override disconnectedCallback() { this.unsubscribe?.(); this.store.clear(); super.disconnectedCallback(); }
  private add(tone: 'info' | 'success' | 'warning' | 'error') {
    this.count += 1;
    const title = { info: 'Informação', success: 'Operação concluída', warning: 'Atenção', error: 'Não foi possível concluir' }[tone];
    this.store.add({ id: `story-${this.count}`, title: `${title} #${this.count}`, description: 'Esta notificação permanece até ser dispensada.', tone, duration: 0 });
  }
  override render() {
    const records = this.store.getSnapshot();
    return html`<div class="actions">
      <button type="button" @click=${() => this.add('info')}>Info</button>
      <button type="button" @click=${() => this.add('success')}>Sucesso</button>
      <button type="button" @click=${() => this.add('warning')}>Aviso</button>
      <button type="button" @click=${() => this.add('error')}>Erro</button>
      <button type="button" @click=${() => this.store.clear()}>Limpar</button>
    </div>
    <section class="toasts" aria-label="Notificações" aria-live="polite" aria-relevant="additions removals">
      ${records.map((record) => html`<article class="toast" data-tone=${record.tone}>
        <div><strong>${record.title}</strong><p>${record.description}</p></div>
        <button type="button" aria-label=${`Dispensar ${record.title}`} @click=${() => this.store.dismiss(record.id)}>Dispensar</button>
      </article>`)}
    </section>
    <p aria-live="polite">${records.length} notificações ativas</p>`;
  }
}

if (!customElements.get('forma-toast-example')) customElements.define('forma-toast-example', FormaToastExample);

export default { title: 'Forma UI/Feedback', parameters: { layout: 'padded' } };
export const Toast = { render: () => html`<h2>Toast notifications</h2><p>Notificações persistentes e dispensáveis. A política de duração deve ser ajustada ao conteúdo e às necessidades do usuário.</p><forma-toast-example></forma-toast-example>` };
export const NativeProgress = { render: () => html`<h2>Progresso nativo</h2><label for="forma-progress">Processamento do arquivo</label><progress id="forma-progress" max="100" value="62">62%</progress><p>Quando a duração é desconhecida, use <code>progress</code> indeterminado em vez de inventar uma porcentagem.</p>` };
