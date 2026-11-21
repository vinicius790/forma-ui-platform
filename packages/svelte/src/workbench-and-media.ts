import { writable } from 'svelte/store';
import {
  createAudioPlayerController, createCodeGutterController, createDiffViewerController, createDockController,
  createMentionController, createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type CodeGutterOptions, type DiffViewerOptions, type DockOptions,
  type MentionOptions, type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';

export function createDockStore(options: DockOptions) {
  const activePaneId = writable(options.activePaneId ?? options.panes[0]?.id ?? null);
  const controller = createDockController({ ...options, onChange: (p, a) => { activePaneId.set(a); options.onChange?.(p, a); } });
  return { activePaneId, controller, destroy: () => controller.destroy() };
}
export function createTimelineStore(options: TimelineOptions) {
  const playhead = writable(options.playhead ?? options.minTime);
  const controller = createTimelineController({ ...options, onPlayheadChange: (t) => { playhead.set(t); options.onPlayheadChange?.(t); } });
  return { playhead, controller, destroy: () => controller.destroy() };
}
export function createDiffViewerStore(options: DiffViewerOptions) {
  const controller = createDiffViewerController(options);
  return { controller, destroy: () => controller.destroy() };
}
export function createMentionStore(options: MentionOptions) {
  const controller = createMentionController(options);
  return { controller, destroy: () => controller.destroy() };
}
export function createSpatialCanvasStore(options: SpatialCanvasOptions = {}) {
  const transform = writable({ x: options.initial?.x ?? 0, y: options.initial?.y ?? 0, zoom: options.initial?.zoom ?? 1 });
  const controller = createSpatialCanvasController({ ...options, onTransformChange: (tr) => { transform.set(tr); options.onTransformChange?.(tr); } });
  return { transform, controller, destroy: () => controller.destroy() };
}
export function createAudioPlayerStore(options: AudioPlayerOptions = {}) {
  const state = writable({ playing: false, muted: false, currentTime: 0, duration: options.duration ?? 0, volume: options.volume ?? 1, playbackRate: options.playbackRate ?? 1 });
  const controller = createAudioPlayerController({ ...options, onStateChange: (s) => { state.set({ ...s }); options.onStateChange?.(s); } });
  return { state, controller, destroy: () => controller.destroy() };
}
export function createCodeGutterStore(options: CodeGutterOptions) {
  const controller = createCodeGutterController(options);
  return { controller, destroy: () => controller.destroy() };
}
export function createWizardDialogStore(options: WizardDialogOptions) {
  const controller = createWizardDialogController(options);
  return { controller, destroy: () => controller.destroy() };
}
