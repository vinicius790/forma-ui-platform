import { onBeforeUnmount, ref } from 'vue';
import {
  createAudioPlayerController, createCodeGutterController, createDiffViewerController, createDockController,
  createMentionController, createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type CodeGutterOptions, type DiffViewerOptions, type DockOptions,
  type MentionOptions, type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';

export function useDock(options: DockOptions) {
  const activePaneId = ref(options.activePaneId ?? options.panes[0]?.id ?? null);
  const controller = createDockController({ ...options, onChange: (p, a) => { activePaneId.value = a; options.onChange?.(p, a); } });
  onBeforeUnmount(() => controller.destroy());
  return { activePaneId, controller };
}
export function useTimeline(options: TimelineOptions) {
  const playhead = ref(options.playhead ?? options.minTime);
  const controller = createTimelineController({ ...options, onPlayheadChange: (t) => { playhead.value = t; options.onPlayheadChange?.(t); } });
  onBeforeUnmount(() => controller.destroy());
  return { playhead, controller };
}
export function useDiffViewer(options: DiffViewerOptions) {
  const controller = createDiffViewerController(options);
  onBeforeUnmount(() => controller.destroy());
  return { controller };
}
export function useMention(options: MentionOptions) {
  const controller = createMentionController(options);
  onBeforeUnmount(() => controller.destroy());
  return { controller };
}
export function useSpatialCanvas(options: SpatialCanvasOptions = {}) {
  const controller = createSpatialCanvasController(options);
  const transform = ref(controller.transform);
  onBeforeUnmount(() => controller.destroy());
  return { transform, controller };
}
export function useAudioPlayer(options: AudioPlayerOptions = {}) {
  const state = ref({ playing: false, muted: false, currentTime: 0, duration: options.duration ?? 0, volume: options.volume ?? 1, playbackRate: options.playbackRate ?? 1 });
  const controller = createAudioPlayerController({ ...options, onStateChange: (s) => { state.value = { ...s }; options.onStateChange?.(s); } });
  onBeforeUnmount(() => controller.destroy());
  return { state, controller };
}
export function useCodeGutter(options: CodeGutterOptions) {
  const controller = createCodeGutterController(options);
  onBeforeUnmount(() => controller.destroy());
  return { controller };
}
export function useWizardDialog(options: WizardDialogOptions) {
  const controller = createWizardDialogController(options);
  onBeforeUnmount(() => controller.destroy());
  return { controller };
}
