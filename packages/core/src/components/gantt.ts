export interface GanttTask {
  id: string;
  title: string;
  duration: number;
  dependencies?: readonly string[];
  progress?: number;
}

export interface ScheduledGanttTask extends GanttTask {
  earlyStart: number;
  earlyFinish: number;
  slack: number;
  critical: boolean;
}

/** Computes earliest start/finish, slack, and critical path over an acyclic Gantt task graph. */
export function computeCriticalPath(tasks: readonly GanttTask[]): { tasks: ScheduledGanttTask[]; totalDuration: number } {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  const visiting = new Set<string>();

  const solveEarly = (id: string): number => {
    if (ef.has(id)) return ef.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const task = byId.get(id);
    if (!task) return 0;
    let start = 0;
    for (const dep of task.dependencies ?? []) start = Math.max(start, solveEarly(dep));
    const finish = start + Math.max(0, task.duration);
    es.set(id, start);
    ef.set(id, finish);
    visiting.delete(id);
    return finish;
  };

  let totalDuration = 0;
  for (const t of tasks) totalDuration = Math.max(totalDuration, solveEarly(t.id));

  const dependents = new Map<string, string[]>();
  for (const t of tasks) {
    for (const dep of t.dependencies ?? []) {
      const list = dependents.get(dep) ?? [];
      list.push(t.id);
      dependents.set(dep, list);
    }
  }

  const lf = new Map<string, number>();
  const solveLateFinish = (id: string): number => {
    if (lf.has(id)) return lf.get(id)!;
    const children = dependents.get(id) ?? [];
    if (children.length === 0) {
      lf.set(id, totalDuration);
      return totalDuration;
    }
    let minLateStart = totalDuration;
    for (const childId of children) {
      const childTask = byId.get(childId)!;
      const childLf = solveLateFinish(childId);
      minLateStart = Math.min(minLateStart, childLf - Math.max(0, childTask.duration));
    }
    lf.set(id, minLateStart);
    return minLateStart;
  };

  const scheduled = tasks.map((t) => {
    const earlyStart = es.get(t.id) ?? 0;
    const earlyFinish = ef.get(t.id) ?? 0;
    const lateFinish = solveLateFinish(t.id);
    const slack = Math.max(0, lateFinish - earlyFinish);
    return { ...t, earlyStart, earlyFinish, slack, critical: slack === 0 && t.duration > 0 };
  });

  return { tasks: scheduled, totalDuration };
}

export class GanttController {
  private tasksList: GanttTask[];
  constructor(tasks: readonly GanttTask[]) { this.tasksList = tasks.map((t) => ({ ...t })); }
  getSchedule() { return computeCriticalPath(this.tasksList); }
  setProgress(id: string, progress: number): void {
    const t = this.tasksList.find((x) => x.id === id);
    if (t) t.progress = Math.min(100, Math.max(0, progress));
  }
  destroy(): void {}
}

export function createGanttController(tasks: readonly GanttTask[]): GanttController {
  return new GanttController(tasks);
}
