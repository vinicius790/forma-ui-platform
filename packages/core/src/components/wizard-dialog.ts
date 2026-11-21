import { createId } from '../primitives/id';

export type TransactionPhase = 'idle' | 'open' | 'confirming' | 'submitting' | 'error';

export interface WizardDialogOptions {
  id?: string;
  dirty?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose?: () => void;
}

/** Transactional confirmation dialog with dirty-close guard and async submit state machine. */
export class WizardDialogController {
  private options: WizardDialogOptions;
  private currentPhase: TransactionPhase = 'idle';
  private lastError: unknown = null;
  readonly baseId: string;

  constructor(options: WizardDialogOptions) {
    this.options = options;
    this.baseId = options.id ?? createId('forma-tx-dialog');
  }

  get phase(): TransactionPhase {
    return this.currentPhase;
  }

  get open(): boolean {
    return this.currentPhase !== 'idle';
  }

  get error(): unknown {
    return this.lastError;
  }

  setDirty(dirty: boolean): void {
    this.options = { ...this.options, dirty };
  }

  show(): void {
    this.lastError = null;
    this.currentPhase = 'open';
  }

  requestClose(): boolean {
    if (this.currentPhase === 'submitting') return false;
    if (this.options.dirty && this.currentPhase === 'open') {
      this.currentPhase = 'confirming';
      return false;
    }
    this.currentPhase = 'idle';
    this.options.onClose?.();
    return true;
  }

  forceClose(): void {
    if (this.currentPhase === 'submitting') return;
    this.currentPhase = 'idle';
    this.options.onClose?.();
  }

  async confirm(): Promise<boolean> {
    if (this.currentPhase === 'submitting') return false;
    this.currentPhase = 'submitting';
    this.lastError = null;
    try {
      await this.options.onConfirm();
      this.currentPhase = 'idle';
      this.options.onClose?.();
      return true;
    } catch (err) {
      this.lastError = err;
      this.currentPhase = 'error';
      return false;
    }
  }

  getDialogProps() {
    return {
      id: `${this.baseId}-dialog`,
      role: 'alertdialog' as const,
      'aria-modal': 'true' as const,
      'aria-busy': this.currentPhase === 'submitting' || undefined,
      'data-phase': this.currentPhase,
      hidden: !this.open,
    };
  }

  destroy(): void {
    this.currentPhase = 'idle';
  }
}

export function createWizardDialogController(options: WizardDialogOptions): WizardDialogController {
  return new WizardDialogController(options);
}
