export interface ElementSize {
  width: number;
  height: number;
}

export function observeElementSize(
  element: Element | null,
  onResize: (size: ElementSize) => void,
): () => void {
  if (!element || typeof ResizeObserver === 'undefined') return () => {};
  let active = true;
  const observer = new ResizeObserver((entries) => {
    if (!active) return;
    const entry = entries[0];
    if (!entry) return;
    onResize({ width: entry.contentRect.width, height: entry.contentRect.height });
  });
  observer.observe(element);
  return () => {
    if (!active) return;
    active = false;
    observer.disconnect();
  };
}

export function observeIntersection(
  element: Element | null,
  onChange: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit,
): () => void {
  if (!element || typeof IntersectionObserver === 'undefined') return () => {};
  let active = true;
  const observer = new IntersectionObserver((entries) => {
    if (!active) return;
    const entry = entries[0];
    if (entry) onChange(entry.isIntersecting, entry);
  }, options);
  observer.observe(element);
  return () => {
    if (!active) return;
    active = false;
    observer.disconnect();
  };
}
