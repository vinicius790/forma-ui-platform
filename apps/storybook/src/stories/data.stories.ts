import { LitElement, css, html, nothing } from 'lit';
import { createCommandPaletteController } from '@forma-ui/commands';
import { createDataGrid } from '@forma-ui/data-grid';

class FormaCommandPaletteExample extends LitElement {
  static override styles = css`:host{display:block;max-width:36rem}.palette{border:1px solid #94a3b8;border-radius:.65rem;padding:1rem;display:grid;gap:.65rem}.results{list-style:none;margin:0;padding:0;display:grid;gap:.25rem}.results button{width:100%;padding:.55rem;text-align:start;border:0;background:transparent;border-radius:.35rem}.results button[aria-selected=true]{background:#dbeafe;color:#172554}`;
  private controller = createCommandPaletteController({
    items: [
      { id: 'settings', label: 'Abrir configurações', keywords: ['preferências', 'ajustes'] },
      { id: 'export', label: 'Exportar relatório', keywords: ['download', 'arquivo'] },
      { id: 'profile', label: 'Editar perfil', keywords: ['conta', 'usuário'] },
      { id: 'help', label: 'Abrir central de ajuda', keywords: ['suporte', 'documentação'] },
    ],
    onSelect: (item) => { this.lastAction = item.label; this.requestUpdate(); },
  });
  private lastAction = 'Nenhuma ação';
  private unsubscribe?: () => void;
  override connectedCallback() { super.connectedCallback(); this.unsubscribe = this.controller.subscribe(() => this.requestUpdate()); }
  override disconnectedCallback() { this.unsubscribe?.(); this.unsubscribe = undefined; super.disconnectedCallback(); }
  override render() {
    const state = this.controller.getSnapshot();
    const input = this.controller.getInputProps();
    return html`<section class="palette" aria-label="Command palette">
      <label for="forma-command-input">Buscar uma ação</label>
      <input id="forma-command-input" type="search" role=${input.role} aria-autocomplete=${input['aria-autocomplete']}
        aria-controls=${input['aria-controls']} aria-activedescendant=${input['aria-activedescendant'] ?? nothing}
        .value=${state.query} placeholder=${input.placeholder}
        @input=${input.onInput} @keydown=${input.onKeyDown} />
      <ul class="results" id=${this.controller.getRootProps()['id']} role="listbox" aria-label="Ações disponíveis">
        ${state.results.map(({ item }) => {
          const props = this.controller.getItemProps(item);
          return html`<li role="presentation"><button id=${props.id} type="button" role=${props.role}
            aria-selected=${String(props['aria-selected'])} aria-disabled=${String(Boolean(props['aria-disabled']))}
            @mousemove=${props.onMouseMove} @click=${props.onClick}>${item.label}</button></li>`;
        })}
      </ul>
      <p aria-live="polite">Última ação: ${this.lastAction}</p>
    </section>`;
  }
}

class FormaDataGridExample extends LitElement {
  static override styles = css`:host{display:block;max-width:58rem}table{border-collapse:collapse;width:100%}th,td{border:1px solid #94a3b8;padding:.5rem;text-align:start}th button{font:inherit;font-weight:700;background:transparent;border:0;cursor:pointer;text-decoration:underline;text-underline-offset:.2em}.toolbar{display:flex;gap:.75rem;align-items:center;margin-block:.75rem;flex-wrap:wrap}`;
  private source = [
    { id: 'p-01', name: 'Ada Lovelace', team: 'Research', score: 97 },
    { id: 'p-02', name: 'Grace Hopper', team: 'Engineering', score: 99 },
    { id: 'p-03', name: 'Katherine Johnson', team: 'Research', score: 96 },
    { id: 'p-04', name: 'Alan Turing', team: 'Computing', score: 98 },
    { id: 'p-05', name: 'Mary Jackson', team: 'Engineering', score: 94 },
  ];
  private columns = [
    { id: 'name', header: 'Nome', accessorKey: 'name' as const, enableSorting: true, enableFiltering: true },
    { id: 'team', header: 'Equipe', accessorKey: 'team' as const, enableSorting: true, enableFiltering: true },
    { id: 'score', header: 'Pontuação', accessorKey: 'score' as const, enableSorting: true },
  ];
  private grid = createDataGrid({ data: this.source, columns: this.columns, getRowId: (row) => row.id, pageSize: 5, locale: 'pt-BR' });
  override render() {
    const rows = this.grid.getPaginationRowModel();
    return html`<div class="toolbar">
      <label for="forma-grid-search">Filtrar dados</label>
      <input id="forma-grid-search" type="search" @input=${(event: Event) => { this.grid.setGlobalFilter((event.currentTarget as HTMLInputElement).value); this.requestUpdate(); }} />
      <button type="button" @click=${() => { this.grid.setPageSize(3); this.requestUpdate(); }}>3 por página</button>
      <button type="button" @click=${() => { this.grid.setPageSize(5); this.requestUpdate(); }}>5 por página</button>
    </div>
    <table>
      <caption>Exemplo de modelo tabular headless</caption>
      <thead><tr>${this.columns.map((column) => html`<th scope="col" aria-sort=${this.grid.getHeaderProps(column.id)['aria-sort']}>
        <button type="button" @click=${() => { this.grid.toggleSorting(column.id); this.requestUpdate(); }}>${column.header}</button>
      </th>`)}</tr></thead>
      <tbody>${rows.map((row) => html`<tr>
        ${this.columns.map((column) => html`<td>${String(row.getValue(column.id) ?? '—')}</td>`)}
      </tr>`)}</tbody>
    </table>
    <div class="toolbar"><span>Página ${this.grid.getSnapshot().pagination.pageIndex + 1} de ${Math.max(1, this.grid.getPageCount())}</span>
      <button type="button" ?disabled=${!this.grid.getCanPreviousPage()} @click=${() => { this.grid.previousPage(); this.requestUpdate(); }}>Anterior</button>
      <button type="button" ?disabled=${!this.grid.getCanNextPage()} @click=${() => { this.grid.nextPage(); this.requestUpdate(); }}>Próxima</button>
      <span aria-live="polite">${this.grid.getRowCount()} registros</span>
    </div>`;
  }
}

for (const [tag, constructor] of [
  ['forma-command-palette-example', FormaCommandPaletteExample],
  ['forma-data-grid-example', FormaDataGridExample],
] as const) if (!customElements.get(tag)) customElements.define(tag, constructor);

export default { title: 'Forma UI/Data and productivity', parameters: { layout: 'padded' } };
export const CommandPalette = { render: () => html`<h2>Command Palette</h2><p>Pesquise, navegue com o teclado e acione um comando.</p><forma-command-palette-example></forma-command-palette-example>` };
export const DataGrid = { render: () => html`<h2>Data Grid</h2><p>Modelo de ordenação, filtragem e paginação; tabela nativa preserva semântica tabular.</p><forma-data-grid-example></forma-data-grid-example>` };
