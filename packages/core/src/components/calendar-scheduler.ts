export interface SchedulerEvent {
  id: string;
  title: string;
  startMinute: number;
  endMinute: number;
  resourceId?: string;
}

export interface PositionedSchedulerEvent extends SchedulerEvent {
  lane: number;
  laneCount: number;
}

/** Assigns collision-free parallel visual lanes to overlapping calendar/resource events. */
export function layoutOverlappingEvents(events: readonly SchedulerEvent[]): PositionedSchedulerEvent[] {
  const sorted = [...events].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const laneEnds: number[] = [];
  const placed: Array<{ event: SchedulerEvent; lane: number }> = [];
  for (const ev of sorted) {
    let lane = laneEnds.findIndex((end) => end <= ev.startMinute);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(ev.endMinute);
    } else {
      laneEnds[lane] = ev.endMinute;
    }
    placed.push({ event: ev, lane });
  }
  const totalLanes = Math.max(1, laneEnds.length);
  return placed.map(({ event, lane }) => ({ ...event, lane, laneCount: totalLanes }));
}

export class CalendarSchedulerController {
  private eventsList: SchedulerEvent[];
  private selectedId: string | null = null;
  private slotMinutes: number;

  constructor(options: { events?: readonly SchedulerEvent[]; slotMinutes?: number } = {}) {
    this.eventsList = (options.events ?? []).map((e) => ({ ...e }));
    this.slotMinutes = Math.max(5, Math.min(120, options.slotMinutes ?? 30));
  }

  get events(): readonly SchedulerEvent[] { return this.eventsList; }
  get selectedEventId(): string | null { return this.selectedId; }

  getLayout(): PositionedSchedulerEvent[] {
    return layoutOverlappingEvents(this.eventsList);
  }

  selectEvent(id: string | null): void { this.selectedId = id; }

  rescheduleEvent(id: string, deltaMinutes: number): boolean {
    const ev = this.eventsList.find((e) => e.id === id);
    if (!ev) return false;
    const snapped = Math.round(deltaMinutes / this.slotMinutes) * this.slotMinutes;
    const duration = ev.endMinute - ev.startMinute;
    const nextStart = Math.max(0, Math.min(1440 - duration, ev.startMinute + snapped));
    ev.startMinute = nextStart;
    ev.endMinute = nextStart + duration;
    return true;
  }

  destroy(): void { this.selectedId = null; }
}

export function createCalendarSchedulerController(options: { events?: readonly SchedulerEvent[]; slotMinutes?: number } = {}): CalendarSchedulerController {
  return new CalendarSchedulerController(options);
}
