import { LitElement, css, html } from 'lit';
import {
  createBottomSheetController,
  createKanbanController,
  createMenubarController,
  createNotificationCenterController,
  createOtpInputController,
} from '@forma-ui/core';

class FormaV50ShowcaseStory extends LitElement {
  static override styles = css`
    :host { display: grid; gap: 1.25rem; font-family: system-ui, sans-serif; }
    section { border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 1rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 0.75rem; }
    .column { border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 0.75rem; }
    .card { border: 1px solid #cbd5e1; border-radius: 0.25rem; padding: 0.5rem; margin-top: 0.5rem; background: #fff; }
    .card[data-grabbed="true"], [data-state="open"] { outline: 2px solid #2563eb; font-weight: 600; }
    .otp-slot { width: 2.25rem; height: 2.5rem; text-align: center; font-size: 1.125rem; }
    .sheet { border: 1px solid #94a3b8; border-radius: 0.75rem 0.75rem 0 0; padding: 1rem; margin-top: 0.75rem; background: #f8fafc; }
    .unread { font-weight: 600; }
  `;

  private kanban = createKanbanController({
    id: 'story-kanban',
    columns: [
      { id: 'todo', title: 'To Do', cards: [{ id: 'c1', title: 'Audit WCAG 2.2 reflow' }, { id: 'c2', title: 'Document Qwik adapter' }] },
      { id: 'doing', title: 'In Progress', wipLimit: 2, cards: [{ id: 'c3', title: 'Ship Forma UI 50.0.0' }] },
      { id: 'done', title: 'Done', cards: [] },
    ],
    onColumnsChange: () => this.requestUpdate(),
    onAnnounce: () => this.requestUpdate(),
  });

  private bottomSheet = createBottomSheetController({
    id: 'story-bottom-sheet',
    modal: false,
    snapPoints: [0.35, 0.7, 0.95],
    defaultSnapIndex: 0,
    onOpenChange: () => this.requestUpdate(),
    onSnapIndexChange: () => this.requestUpdate(),
  });

  private otp = createOtpInputController({
    id: 'story-otp',
    length: 6,
    mode: 'numeric',
    defaultValue: '502',
    onValueChange: () => this.requestUpdate(),
    onComplete: () => this.requestUpdate(),
  });

  private menubar = createMenubarController({
    id: 'story-menubar',
    items: [{ id: 'file' }, { id: 'edit' }, { id: 'view' }],
    onActiveMenuChange: () => this.requestUpdate(),
  });

  private notifications = createNotificationCenterController({
    initialItems: [
      {
        id: 'n1',
        title: 'Forma UI 50.0.0 ready',
        body: 'OKLCH engine, Qwik adapter, and 10 v50 controllers active.',
        category: 'release',
        priority: 'high',
        read: false,
        archived: false,
        createdAt: 1730000000000,
      },
      {
        id: 'n2',
        title: 'Accessibility reminder',
        body: 'Pair automated checks with manual keyboard and screen-reader testing.',
        category: 'a11y',
        priority: 'normal',
        read: true,
        archived: false,
        createdAt: 1730000001000,
      },
    ],
    onChange: () => this.requestUpdate(),
  });

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.kanban.destroy();
    this.bottomSheet.destroy();
    this.otp.destroy();
    this.menubar.destroy();
    this.notifications.destroy();
  }

  override render() {
    const boardProps = this.kanban.getBoardProps('Sprint Kanban');
    const sheetProps = this.bottomSheet.getSheetProps();
    const dragProps = this.bottomSheet.getDragHandleProps();
    const otpRoot = this.otp.getRootProps('Six-digit verification code');
    const menubarProps = this.menubar.getMenubarProps('Workspace menu');

    return html`
      <section>
        <h3>Kanban (v50)</h3>
        <p aria-live="polite">${this.kanban.announcement || 'Focus a card and press Space/Enter to pick up, then Arrow keys to move.'}</p>
        <div class="columns" id=${boardProps.id} role=${boardProps.role} aria-label=${boardProps['aria-label']}>
          ${this.kanban.columns.map((col) => {
            const colProps = this.kanban.getColumnProps(col.id);
            return html`
              <div class="column">
                <strong>${col.title}</strong>
                <div id=${colProps.id} role=${colProps.role} aria-label=${colProps['aria-label']}>
                  ${col.cards.map((card) => {
                    const cardProps = this.kanban.getCardProps(card.id);
                    return html`
                      <div
                        class="card"
                        id=${cardProps.id}
                        role=${cardProps.role}
                        tabindex=${cardProps.tabIndex}
                        aria-roledescription=${cardProps['aria-roledescription']}
                        data-grabbed=${cardProps['data-grabbed']}
                        @keydown=${cardProps.onKeyDown}
                      >
                        ${card.title}
                      </div>
                    `;
                  })}
                </div>
              </div>
            `;
          })}
        </div>
      </section>

      <section>
        <h3>BottomSheet (v50) — Snap ${Math.round(this.bottomSheet.snapPoint * 100)}%</h3>
        <div class="row">
          <button type="button" @click=${() => this.bottomSheet.setOpen(!this.bottomSheet.open)}>
            ${this.bottomSheet.open ? 'Close Sheet' : 'Open Sheet'}
          </button>
          <button type="button" @click=${() => this.bottomSheet.snapTo(1)}>Snap 70%</button>
          <button type="button" @click=${() => this.bottomSheet.snapTo(2)}>Snap 95%</button>
        </div>
        <div
          class="sheet"
          id=${sheetProps.id}
          role=${sheetProps.role}
          aria-labelledby=${sheetProps['aria-labelledby']}
          data-state=${sheetProps['data-state']}
          data-snap-index=${String(sheetProps['data-snap-index'])}
          ?hidden=${sheetProps.hidden}
        >
          <div
            role=${dragProps.role}
            tabindex=${dragProps.tabIndex}
            aria-label=${dragProps['aria-label']}
            aria-orientation=${dragProps['aria-orientation']}
            aria-valuemin=${String(dragProps['aria-valuemin'])}
            aria-valuemax=${String(dragProps['aria-valuemax'])}
            aria-valuenow=${String(dragProps['aria-valuenow'])}
            @keydown=${dragProps.onKeyDown}
          >
            ≡ Drag Handle (ArrowUp / ArrowDown / Escape)
          </div>
          <h4 id=${sheetProps['aria-labelledby']}>Bottom Sheet Details</h4>
          <p>Current snap ratio: ${this.bottomSheet.snapPoint}</p>
        </div>
      </section>

      <section>
        <h3>OtpInput (v50) — Value: ${this.otp.value || '(empty)'} ${this.otp.isComplete ? '(Complete)' : ''}</h3>
        <div class="row" id=${otpRoot.id} role=${otpRoot.role} aria-label=${otpRoot['aria-label']} data-complete=${otpRoot['data-complete']}>
          ${Array.from({ length: this.otp.length }, (_, i) => {
            const p = this.otp.getInputProps(i);
            return html`
              <input
                class="otp-slot"
                id=${p.id}
                type=${p.type}
                inputmode=${p.inputMode}
                autocomplete=${p.autoComplete}
                maxlength=${String(p.maxLength)}
                .value=${p.value}
                aria-label=${p['aria-label']}
                @focus=${p.onFocus}
                @input=${p.onInput}
                @keydown=${p.onKeyDown}
              />
            `;
          })}
          <button type="button" @click=${() => this.otp.clear()}>Clear</button>
        </div>
      </section>

      <section>
        <h3>Menubar (v50) — Active: ${this.menubar.activeMenu ?? 'none'}</h3>
        <div class="row" id=${menubarProps.id} role=${menubarProps.role} aria-label=${menubarProps['aria-label']}>
          ${(['file', 'edit', 'view'] as const).map((id) => {
            const trigger = this.menubar.getTriggerProps(id);
            const menu = this.menubar.getMenuProps(id);
            return html`
              <div>
                <button
                  type="button"
                  id=${trigger.id}
                  role=${trigger.role}
                  tabindex=${trigger.tabIndex}
                  aria-haspopup=${trigger['aria-haspopup']}
                  aria-expanded=${String(trigger['aria-expanded'])}
                  aria-controls=${trigger['aria-controls']}
                  data-state=${trigger['data-state']}
                  @click=${trigger.onClick}
                  @pointerenter=${trigger.onPointerEnter}
                  @keydown=${trigger.onKeyDown}
                >
                  ${id.toUpperCase()}
                </button>
                <div id=${menu.id} role=${menu.role} aria-labelledby=${menu['aria-labelledby']} ?hidden=${menu.hidden}>
                  <button type="button" role="menuitem" @click=${() => this.menubar.closeAll()}>Close ${id}</button>
                </div>
              </div>
            `;
          })}
        </div>
      </section>

      <section>
        <h3>NotificationCenter (v50) — Unread: ${this.notifications.unreadCount}</h3>
        <div class="row">
          <button type="button" @click=${() => this.notifications.push({ title: 'New build completed', category: 'ci', priority: 'normal' })}>
            Push Notification
          </button>
          <button type="button" @click=${() => this.notifications.markAllRead()}>Mark All Read</button>
        </div>
        <ul>
          ${this.notifications.items.map(
            (item) => html`
              <li class=${item.read ? '' : 'unread'}>
                <span>${item.title}</span>
                ${item.body ? html` — <small>${item.body}</small>` : ''}
                <button type="button" @click=${() => this.notifications.markRead(item.id, !item.read)}>
                  ${item.read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button type="button" @click=${() => this.notifications.dismiss(item.id)}>Dismiss</button>
              </li>
            `,
          )}
        </ul>
      </section>
    `;
  }
}

if (!customElements.get('forma-v50-showcase-story')) {
  customElements.define('forma-v50-showcase-story', FormaV50ShowcaseStory);
}

export default { title: 'Forma UI 50.0/Showcase' };
export const V50PlatformControllers = () => html`<forma-v50-showcase-story></forma-v50-showcase-story>`;
