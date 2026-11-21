export interface ViewportMetrics {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
  scale: number;
  estimatedKeyboardHeight: number;
}

/** SSR-safe VisualViewport & virtual-keyboard height observer for mobile overlays and bottom sheets. */
export function observeVisualViewport(
  onChange: (metrics: ViewportMetrics) => void,
  win?: Window,
): () => void {
  const target = win ?? (typeof window !== 'undefined' ? window : undefined);
  const vv = target?.visualViewport;
  if (!target || !vv) return () => {};
  let active = true;
  const emit = () => {
    if (!active) return;
    const estimatedKeyboardHeight = Math.max(0, Math.round(target.innerHeight - vv.height - vv.offsetTop));
    onChange({
      width: vv.width,
      height: vv.height,
      offsetTop: vv.offsetTop,
      offsetLeft: vv.offsetLeft,
      scale: vv.scale,
      estimatedKeyboardHeight,
    });
  };
  vv.addEventListener('resize', emit);
  vv.addEventListener('scroll', emit);
  emit();
  return () => {
    if (!active) return;
    active = false;
    vv.removeEventListener('resize', emit);
    vv.removeEventListener('scroll', emit);
  };
}
