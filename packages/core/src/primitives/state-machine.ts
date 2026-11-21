/**
 * Small deterministic state-machine runtime for component behavior.
 * It deliberately implements flat finite-state transitions; it is not a
 * replacement for a full statecharts runtime such as XState.
 */
export interface MachineSnapshot<State extends string, Context> {
  readonly state: State;
  readonly context: Readonly<Context>;
  readonly status: 'active' | 'stopped';
  readonly changed: boolean;
  readonly revision: number;
}

export interface MachineTransition<State extends string, Context> {
  readonly state?: State;
  readonly context?: Context;
  readonly updateContext?: (current: Readonly<Context>) => Context;
}

export interface MachineConfig<State extends string, Event, Context> {
  readonly id: string;
  readonly initialState: State;
  readonly initialContext: Context;
  readonly transition: (
    snapshot: MachineSnapshot<State, Context>,
    event: Event,
  ) => MachineTransition<State, Context> | null | undefined;
  readonly onTransition?: (snapshot: MachineSnapshot<State, Context>, event: Event) => void;
}

export interface MachineActor<State extends string, Event, Context> {
  getSnapshot(): MachineSnapshot<State, Context>;
  subscribe(listener: (snapshot: MachineSnapshot<State, Context>) => void): () => void;
  send(event: Event): MachineSnapshot<State, Context>;
  matches(state: State): boolean;
  stop(): void;
}

export function createMachineActor<State extends string, Event, Context>(
  config: MachineConfig<State, Event, Context>,
): MachineActor<State, Event, Context> {
  if (!config.id.trim()) throw new Error('A machine id must be a non-empty string.');

  let snapshot: MachineSnapshot<State, Context> = Object.freeze({
    state: config.initialState,
    context: config.initialContext,
    status: 'active',
    changed: false,
    revision: 0,
  });
  const listeners = new Set<(next: MachineSnapshot<State, Context>) => void>();
  let notifying = false;
  const pending: MachineSnapshot<State, Context>[] = [];

  const publish = (next: MachineSnapshot<State, Context>) => {
    pending.push(next);
    if (notifying) return;
    notifying = true;
    try {
      while (pending.length) {
        const current = pending.shift()!;
        for (const listener of [...listeners]) listener(current);
      }
    } finally {
      notifying = false;
    }
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (snapshot.status === 'stopped') return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send(event) {
      if (snapshot.status === 'stopped') return snapshot;
      const change = config.transition(snapshot, event);
      if (!change) {
        snapshot = Object.freeze({ ...snapshot, changed: false });
        return snapshot;
      }
      const nextContext = change.updateContext
        ? change.updateContext(snapshot.context)
        : change.context ?? snapshot.context;
      snapshot = Object.freeze({
        state: change.state ?? snapshot.state,
        context: nextContext as Context,
        status: 'active',
        changed: true,
        revision: snapshot.revision + 1,
      });
      publish(snapshot);
      config.onTransition?.(snapshot, event);
      return snapshot;
    },
    matches(state) { return snapshot.state === state; },
    stop() {
      if (snapshot.status === 'stopped') return;
      snapshot = Object.freeze({ ...snapshot, status: 'stopped', changed: false, revision: snapshot.revision + 1 });
      publish(snapshot);
      listeners.clear();
      pending.length = 0;
    },
  };
}
