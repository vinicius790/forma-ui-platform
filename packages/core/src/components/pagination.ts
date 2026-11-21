export interface PaginationOptions { page?: number; defaultPage?: number; pageCount: number; siblingCount?: number; boundaryCount?: number; disabled?: boolean; onPageChange?: (page: number) => void }
export class PaginationController {
  private options: PaginationOptions; private internal: number;
  constructor(options: PaginationOptions) { this.options = { ...options }; this.internal = this.clamp(options.defaultPage ?? 1); }
  get pageCount(): number { return Math.max(0, Math.floor(Number.isFinite(this.options.pageCount) ? this.options.pageCount : 0)); }
  get page(): number { return this.clamp(this.options.page ?? this.internal); }
  get canPrevious(): boolean { return !this.options.disabled && this.page > 1; }
  get canNext(): boolean { return !this.options.disabled && this.page < this.pageCount; }
  updateOptions(options: Partial<PaginationOptions>): void { this.options = { ...this.options, ...options }; this.internal = this.clamp(this.internal); }
  setPage(page: number): void { const next = this.clamp(page); if (this.options.disabled || next === this.page) return; if (this.options.page === undefined) this.internal = next; this.options.onPageChange?.(next); }
  previous(): void { if (this.canPrevious) this.setPage(this.page - 1); }
  next(): void { if (this.canNext) this.setPage(this.page + 1); }
  getPreviousProps() { return { type: 'button' as const, disabled: !this.canPrevious, 'aria-label': 'Go to previous page', onClick: () => this.previous() }; }
  getNextProps() { return { type: 'button' as const, disabled: !this.canNext, 'aria-label': 'Go to next page', onClick: () => this.next() }; }
  getPageProps(page: number) { const current = page === this.page; return { type: 'button' as const, disabled: Boolean(this.options.disabled) || page < 1 || page > this.pageCount, 'aria-label': `Go to page ${page}`, 'aria-current': current ? 'page' as const : undefined, onClick: () => this.setPage(page) }; }
  getPageItems(): Array<number | 'ellipsis'> { const count = this.pageCount; if (!count) return []; const sibling = Math.max(0, Math.floor(this.options.siblingCount ?? 1)); const boundary = Math.max(1, Math.floor(this.options.boundaryCount ?? 1)); const visible = new Set<number>(); for (let i = 1; i <= Math.min(boundary, count); i++) visible.add(i); for (let i = Math.max(1, count - boundary + 1); i <= count; i++) visible.add(i); for (let i = Math.max(1, this.page - sibling); i <= Math.min(count, this.page + sibling); i++) visible.add(i); const pages = [...visible].sort((a, b) => a - b); const result: Array<number | 'ellipsis'> = []; for (const [i, page] of pages.entries()) { if (i > 0) { const gap = page - pages[i - 1]!; if (gap === 2) result.push(page - 1); else if (gap > 2) result.push('ellipsis'); } result.push(page); } return result; }
  private clamp(value: number): number { if (!this.pageCount) return 0; return Math.min(this.pageCount, Math.max(1, Math.floor(Number.isFinite(value) ? value : 1))); }
}
export function createPaginationController(options: PaginationOptions): PaginationController { return new PaginationController(options); }
