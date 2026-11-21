import { useEffect, useRef, useState } from 'react';
import {
  createAudioPlayerController, createCodeGutterController, createDiffViewerController, createDockController,
  createMentionController, createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type CodeGutterOptions, type DiffViewerOptions, type DockOptions,
  type MentionOptions, type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';

function useLazyV100<C extends { destroy(): void }>(factory: () => C): C {
  const ref = useRef<C | null>(null);
  if (!ref.current) ref.current = factory();
  useEffect(() => { const c = ref.current; return () => { c?.destroy(); ref.current = null; }; }, []);
  return ref.current;
}

export function useDock(options: DockOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV100(() => createDockController({ ...options, onChange: (p, a) => { bump((n) => n + 1); options.onChange?.(p, a); } }));
  return { panes: controller.panes, activePaneId: controller.activePaneId, maximizedPane: controller.maximizedPane, controller };
}
export function useTimeline(options: TimelineOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV100(() => createTimelineController({ ...options, onPlayheadChange: (t) => { bump((n) => n + 1); options.onPlayheadChange?.(t); }, onSelectChange: (id) => { bump((n) => n + 1); options.onSelectChange?.(id); } }));
  return { playhead: controller.playhead, zoom: controller.zoom, selectedItemId: controller.selectedItemId, controller };
}
export function useDiffViewer(options: DiffViewerOptions) {
  const controller = useLazyV100(() => createDiffViewerController(options));
  return { lines: controller.lines, stats: controller.stats, viewMode: controller.viewMode, controller };
}
export function useMention(options: MentionOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV100(() => createMentionController({ ...options, onSelect: (c, t, cur) => { bump((n) => n + 1); options.onSelect?.(c, t, cur); } }));
  return { open: controller.open, candidates: controller.filteredCandidates, controller };
}
export function useSpatialCanvas(options: SpatialCanvasOptions = {}) {
  const [, bump] = useState(0);
  const controller = useLazyV100(() => createSpatialCanvasController({ ...options, onTransformChange: (tr) => { bump((n) => n + 1); options.onTransformChange?.(tr); } }));
  return { transform: controller.transform, canvasProps: controller.getCanvasProps(), controller };
}
export function useAudioPlayer(options: AudioPlayerOptions = {}) {
  const [, bump] = useState(0);
  const controller = useLazyV100(() => createAudioPlayerController({ ...options, onStateChange: (s) => { bump((n) => n + 1); options.onStateChange?.(s); } }));
  return { state: controller.state, scrubberProps: controller.getScrubberProps(), controller };
}
export function useCodeGutter(options: CodeGutterOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV100(() => createCodeGutterController({ ...options, onChange: () => { bump((n) => n + 1); options.onChange?.(); } }));
  return { breakpoints: controller.breakpoints, visibleLines: controller.getVisibleLines(), controller };
}
export function useWizardDialog(options: WizardDialogOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV100(() => createWizardDialogController({ ...options, onClose: () => { bump((n) => n + 1); options.onClose?.(); } }));
  return { open: controller.open, phase: controller.phase, dialogProps: controller.getDialogProps(), controller };
}
