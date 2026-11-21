import { createTelemetryBus, type TelemetryBus, type TelemetryEvent } from '@forma-ui/core';

export interface RegisteredControllerMeta {
  id: string;
  name: string;
  readState: () => Record<string, unknown>;
}

export interface DomHealthReport {
  duplicateIds: string[];
  danglingAriaRefs: Array<{ attribute: string; missingId: string }>;
  positiveTabIndexCount: number;
  healthy: boolean;
}

export interface DevtoolsSnapshot {
  controllers: Array<{ id: string; name: string; state: Record<string, unknown> }>;
  events: readonly TelemetryEvent[];
  eventCount: number;
}

/**
 * Opt-in Forma UI runtime inspector. Connects controller registries, telemetry timelines,
 * and non-invasive DOM ARIA diagnostics without injecting CSS or mutating application state.
 */
export class FormaDevtoolsInspector {
  readonly bus: TelemetryBus;
  private registry = new Map<string, RegisteredControllerMeta>();

  constructor(bus: TelemetryBus = createTelemetryBus(500)) {
    this.bus = bus;
  }

  register(meta: RegisteredControllerMeta): () => void {
    this.registry.set(meta.id, meta);
    this.bus.emit({ id: meta.id, controller: meta.name, action: 'register', severity: 'info' });
    return () => {
      this.registry.delete(meta.id);
      this.bus.emit({ id: meta.id, controller: meta.name, action: 'unregister', severity: 'info' });
    };
  }

  recordTransition(id: string, controller: string, action: string, detail?: Record<string, unknown>): void {
    this.bus.emit({ id, controller, action, severity: 'info', detail });
  }

  snapshot(): DevtoolsSnapshot {
    const controllers = [...this.registry.values()].map((meta) => ({
      id: meta.id,
      name: meta.name,
      state: meta.readState(),
    }));
    const events = this.bus.getHistory();
    return { controllers, events, eventCount: events.length };
  }

  exportReportJson(): string {
    return JSON.stringify(this.snapshot(), null, 2);
  }

  inspectDom(root: ParentNode): DomHealthReport {
    const seenIds = new Set<string>();
    const dupIds = new Set<string>();
    for (const el of root.querySelectorAll('[id]')) {
      if (!el.id) continue;
      if (seenIds.has(el.id)) dupIds.add(el.id);
      seenIds.add(el.id);
    }

    const danglingAriaRefs: Array<{ attribute: string; missingId: string }> = [];
    const attrs = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'];
    for (const el of root.querySelectorAll('*')) {
      for (const attr of attrs) {
        const val = el.getAttribute(attr);
        if (!val) continue;
        for (const id of val.trim().split(/\s+/u)) {
          if (id && !seenIds.has(id)) danglingAriaRefs.push({ attribute: attr, missingId: id });
        }
      }
    }

    let positiveTabIndexCount = 0;
    for (const el of root.querySelectorAll('[tabindex]')) {
      const num = Number(el.getAttribute('tabindex'));
      if (Number.isFinite(num) && num > 0) positiveTabIndexCount += 1;
    }

    return {
      duplicateIds: [...dupIds],
      danglingAriaRefs,
      positiveTabIndexCount,
      healthy: dupIds.size === 0 && danglingAriaRefs.length === 0 && positiveTabIndexCount === 0,
    };
  }

  destroy(): void {
    this.registry.clear();
    this.bus.clear();
  }
}

export function createDevtoolsInspector(bus?: TelemetryBus): FormaDevtoolsInspector {
  return new FormaDevtoolsInspector(bus);
}
