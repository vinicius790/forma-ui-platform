interface LockState { count: number; overflow: string; paddingRight: string }
const locks = new WeakMap<HTMLElement, LockState>();
export function lockScroll(target?: HTMLElement): () => void {
  const body = target ?? (typeof document !== 'undefined' ? document.body : undefined);
  if (!body) return () => undefined;
  const existing = locks.get(body);
  if (existing) existing.count += 1;
  else {
    const view = body.ownerDocument.defaultView;
    const scrollbar = view ? Math.max(0, view.innerWidth - body.ownerDocument.documentElement.clientWidth) : 0;
    const state = { count: 1, overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    locks.set(body, state); body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${(Number.parseFloat(view?.getComputedStyle(body).paddingRight ?? '0') || 0) + scrollbar}px`;
  }
  let released = false;
  return () => { if (released) return; released = true; const state = locks.get(body); if (!state) return; state.count -= 1; if (state.count <= 0) { body.style.overflow = state.overflow; body.style.paddingRight = state.paddingRight; locks.delete(body); } };
}
