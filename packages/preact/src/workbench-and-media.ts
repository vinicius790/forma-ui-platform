import { useEffect, useReducer, useRef } from 'preact/hooks';
import {
  createAudioPlayerController, createCodeGutterController, createDiffViewerController, createDockController,
  createMentionController, createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type CodeGutterOptions, type DiffViewerOptions, type DockOptions,
  type MentionOptions, type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';

function useLazyPreactV100<C extends { destroy(): void }>(factory: () => C): C {
  const ref = useRef<C | null>(null);
  if (!ref.current) ref.current = factory();
  useEffect(() => { const c = ref.current; return () => { c?.destroy(); ref.current = null; }; }, []);
  return ref.current;
}

export function useDock(options: DockOptions) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreactV100(() => createDockController({ ...options, onChange: (p, a) => { bump(undefined); options.onChange?.(p, a); } }));
}
export function useTimeline(options: TimelineOptions) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreactV100(() => createTimelineController({ ...options, onPlayheadChange: (t) => { bump(undefined); options.onPlayheadChange?.(t); } }));
}
export function useDiffViewer(options: DiffViewerOptions) { return useLazyPreactV100(() => createDiffViewerController(options)); }
export function useMention(options: MentionOptions) { return useLazyPreactV100(() => createMentionController(options)); }
export function useSpatialCanvas(options: SpatialCanvasOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreactV100(() => createSpatialCanvasController({ ...options, onTransformChange: (tr) => { bump(undefined); options.onTransformChange?.(tr); } }));
}
export function useAudioPlayer(options: AudioPlayerOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreactV100(() => createAudioPlayerController({ ...options, onStateChange: (s) => { bump(undefined); options.onStateChange?.(s); } }));
}
export function useCodeGutter(options: CodeGutterOptions) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreactV100(() => createCodeGutterController({ ...options, onChange: () => { bump(undefined); options.onChange?.(); } }));
}
export function useWizardDialog(options: WizardDialogOptions) { return useLazyPreactV100(() => createWizardDialogController(options)); }
