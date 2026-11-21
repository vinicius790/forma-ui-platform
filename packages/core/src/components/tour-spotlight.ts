export interface MacroStep {
  readonly controller: string;
  readonly action: string;
  readonly payload?: unknown;
  readonly deltaMs: number;
}

/** Records semantic headless controller actions for deterministic replay, onboarding demos, and automated QA. */
export class MacroRecorder {
  private recording = false;
  private stepsList: MacroStep[] = [];
  private lastStamp = 0;

  get isRecording(): boolean { return this.recording; }
  get steps(): readonly MacroStep[] { return this.stepsList; }

  start(now = Date.now()): void {
    this.recording = true;
    this.stepsList = [];
    this.lastStamp = now;
  }

  record(controller: string, action: string, payload?: unknown, now = Date.now()): void {
    if (!this.recording) return;
    const deltaMs = Math.max(0, now - this.lastStamp);
    this.lastStamp = now;
    this.stepsList.push(Object.freeze({ controller, action, payload, deltaMs }));
  }

  stop(): readonly MacroStep[] {
    this.recording = false;
    return [...this.stepsList];
  }

  serialize(): string { return JSON.stringify(this.stepsList); }

  async replay(executor: (step: MacroStep) => void | Promise<void>, speed = Infinity): Promise<number> {
    let executed = 0;
    for (const step of this.stepsList) {
      if (Number.isFinite(speed) && speed > 0 && step.deltaMs > 0) {
        await new Promise((r) => setTimeout(r, Math.round(step.deltaMs / speed)));
      }
      await executor(step);
      executed += 1;
    }
    return executed;
  }

  destroy(): void { this.recording = false; this.stepsList = []; }
}

export function createMacroRecorder(): MacroRecorder {
  return new MacroRecorder();
}
