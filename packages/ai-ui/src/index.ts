import { createId } from '@forma-ui/core';

export type StreamStatus = 'idle' | 'streaming' | 'paused' | 'complete' | 'aborted' | 'error';

export interface StreamingMessageOptions {
  id?: string;
  announceThrottleMs?: number;
  onChange?: (snapshot: StreamingMessageSnapshot) => void;
}

export interface StreamingMessageSnapshot {
  status: StreamStatus;
  content: string;
  chunkCount: number;
  liveAnnouncement: string;
  error?: unknown;
}

/** Accessible streaming LLM/agent response controller with abort & throttled live announcements. */
export class StreamingMessageController {
  private statusValue: StreamStatus = 'idle';
  private buffer = '';
  private chunks = 0;
  private announcement = '';
  private lastAnnouncedAt = 0;
  private throttleMs: number;
  private errorValue: unknown;
  private abortController: AbortController | null = null;
  private onChange?: (snapshot: StreamingMessageSnapshot) => void;
  readonly baseId: string;

  constructor(options: StreamingMessageOptions = {}) {
    this.throttleMs = Math.max(250, options.announceThrottleMs ?? 1500);
    this.onChange = options.onChange;
    this.baseId = options.id ?? createId('forma-ai-stream');
  }

  get snapshot(): StreamingMessageSnapshot {
    return Object.freeze({
      status: this.statusValue,
      content: this.buffer,
      chunkCount: this.chunks,
      liveAnnouncement: this.announcement,
      ...(this.errorValue !== undefined ? { error: this.errorValue } : {}),
    });
  }

  private emit(): void {
    this.onChange?.(this.snapshot);
  }

  start(): AbortSignal {
    this.abortController?.abort();
    this.abortController = new AbortController();
    this.statusValue = 'streaming';
    this.buffer = '';
    this.chunks = 0;
    this.errorValue = undefined;
    this.announcement = 'Assistant is generating a response.';
    this.lastAnnouncedAt = Date.now();
    this.emit();
    return this.abortController.signal;
  }

  append(chunk: string): void {
    if (this.statusValue !== 'streaming') return;
    this.buffer += chunk;
    this.chunks += 1;
    const now = Date.now();
    if (now - this.lastAnnouncedAt >= this.throttleMs) {
      this.announcement = `Generating response (${this.buffer.length} characters).`;
      this.lastAnnouncedAt = now;
    }
    this.emit();
  }

  complete(): void {
    if (this.statusValue !== 'streaming' && this.statusValue !== 'paused') return;
    this.statusValue = 'complete';
    this.announcement = 'Response complete.';
    this.emit();
  }

  abort(): void {
    this.abortController?.abort();
    this.statusValue = 'aborted';
    this.announcement = 'Response stopped.';
    this.emit();
  }

  fail(error: unknown): void {
    this.errorValue = error;
    this.statusValue = 'error';
    this.announcement = 'Response failed.';
    this.emit();
  }

  getMessageProps() {
    return {
      id: this.baseId,
      role: 'region' as const,
      'aria-busy': this.statusValue === 'streaming',
      'aria-live': 'off' as const,
      'data-status': this.statusValue,
    };
  }

  getLiveRegionProps() {
    return { role: 'status' as const, 'aria-live': 'polite' as const, 'aria-atomic': 'true' as const };
  }

  destroy(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}

export function createStreamingMessageController(options: StreamingMessageOptions = {}): StreamingMessageController {
  return new StreamingMessageController(options);
}

export type ApprovalDecision = 'pending' | 'approved' | 'rejected';

export interface ToolApprovalRequest {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  riskLevel?: 'low' | 'medium' | 'high';
  decision: ApprovalDecision;
  reason?: string;
}

export class ToolApprovalController {
  private queue: ToolApprovalRequest[] = [];
  private onChange?: (queue: readonly ToolApprovalRequest[]) => void;

  constructor(onChange?: (queue: readonly ToolApprovalRequest[]) => void) {
    this.onChange = onChange;
  }

  get requests(): readonly ToolApprovalRequest[] {
    return this.queue;
  }

  get pendingCount(): number {
    return this.queue.filter((r) => r.decision === 'pending').length;
  }

  enqueue(input: Omit<ToolApprovalRequest, 'decision'>): ToolApprovalRequest {
    const req: ToolApprovalRequest = { ...input, decision: 'pending' };
    this.queue = [...this.queue, req];
    this.onChange?.(this.queue);
    return req;
  }

  approve(id: string, editedArgs?: Record<string, unknown>): boolean {
    let changed = false;
    this.queue = this.queue.map((r) => {
      if (r.id !== id || r.decision !== 'pending') return r;
      changed = true;
      return { ...r, args: editedArgs ?? r.args, decision: 'approved' };
    });
    if (changed) this.onChange?.(this.queue);
    return changed;
  }

  reject(id: string, reason?: string): boolean {
    let changed = false;
    this.queue = this.queue.map((r) => {
      if (r.id !== id || r.decision !== 'pending') return r;
      changed = true;
      return { ...r, decision: 'rejected', reason };
    });
    if (changed) this.onChange?.(this.queue);
    return changed;
  }

  destroy(): void {
    this.queue = [];
  }
}

export function createToolApprovalController(onChange?: (queue: readonly ToolApprovalRequest[]) => void): ToolApprovalController {
  return new ToolApprovalController(onChange);
}

export interface CitationSource {
  id: string;
  title: string;
  url?: string;
}

export class CitationController {
  private sources: readonly CitationSource[];
  private activeId: string | null = null;
  readonly baseId: string;

  constructor(sources: readonly CitationSource[], id?: string) {
    this.sources = sources;
    this.baseId = id ?? createId('forma-cite');
  }

  get activeSourceId(): string | null {
    return this.activeId;
  }

  focusSource(id: string | null): void {
    this.activeId = id;
  }

  getBadgeProps(sourceId: string, index: number) {
    return {
      type: 'button' as const,
      'aria-label': `Citation ${index + 1}`,
      'aria-describedby': `${this.baseId}-source-${sourceId}`,
      'data-active': this.activeId === sourceId ? 'true' : 'false',
      onClick: () => this.focusSource(sourceId),
    };
  }

  getSourceProps(sourceId: string) {
    return {
      id: `${this.baseId}-source-${sourceId}`,
      'data-highlighted': this.activeId === sourceId ? 'true' : 'false',
    };
  }

  destroy(): void {
    this.activeId = null;
  }
}

export function createCitationController(sources: readonly CitationSource[], id?: string): CitationController {
  return new CitationController(sources, id);
}
