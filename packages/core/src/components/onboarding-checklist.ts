export interface ChecklistStep { id: string; title: string; completed?: boolean; requires?: readonly string[] }

export class OnboardingChecklistController {
  private stepsList: ChecklistStep[];
  constructor(steps: readonly ChecklistStep[]) {
    this.stepsList = steps.map((s) => ({ ...s, completed: Boolean(s.completed) }));
  }
  get steps(): readonly ChecklistStep[] { return this.stepsList; }
  get progressPercent(): number {
    if (!this.stepsList.length) return 100;
    return Math.round((this.stepsList.filter((s) => s.completed).length / this.stepsList.length) * 100);
  }
  canComplete(id: string): boolean {
    const step = this.stepsList.find((s) => s.id === id);
    if (!step) return false;
    return (step.requires ?? []).every((reqId) => Boolean(this.stepsList.find((s) => s.id === reqId)?.completed));
  }
  completeStep(id: string): boolean {
    if (!this.canComplete(id)) return false;
    this.stepsList = this.stepsList.map((s) => (s.id === id ? { ...s, completed: true } : s));
    return true;
  }
  destroy(): void {}
}
export function createOnboardingChecklistController(steps: readonly ChecklistStep[]): OnboardingChecklistController {
  return new OnboardingChecklistController(steps);
}
