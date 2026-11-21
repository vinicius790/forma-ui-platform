import { createSignal, onCleanup } from 'solid-js';
import {
  createAudioPlayerController, createCodeGutterController, createDiffViewerController, createDockController,
  createMentionController, createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type CodeGutterOptions, type DiffViewerOptions, type DockOptions,
  type MentionOptions, type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';

export function createDock(options: DockOptions) {
  const [activePaneId, setActivePaneId] = createSignal(options.activePaneId ?? options.panes[0]?.id ?? null);
  const controller = createDockController({ ...options, onChange: (p, a) => { setActivePaneId(a); options.onChange?.(p, a); } });
  onCleanup(() => controller.destroy());
  return { activePaneId, controller };
}
export function createTimeline(options: TimelineOptions) {
  const [playhead, setPlayhead] = createSignal(options.playhead ?? options.minTime);
  const controller = createTimelineController({ ...options, onPlayheadChange: (t) => { setPlayhead(t); options.onPlayheadChange?.(t); } });
  onCleanup(() => controller.destroy());
  return { playhead, controller };
}
export function createDiffViewer(options: DiffViewerOptions) {
  const controller = createDiffViewerController(options);
  onCleanup(() => controller.destroy());
  return { controller };
}
export function createMention(options: MentionOptions) {
  const controller = createMentionController(options);
  onCleanup(() => controller.destroy());
  return { controller };
}
export function createSpatialCanvas(options: SpatialCanvasOptions = {}) {
  const [transform, setTransform] = createSignal({ x: options.initial?.x ?? 0, y: options.initial?.y ?? 0, zoom: options.initial?.zoom ?? 1 });
  const controller = createSpatialCanvasController({ ...options, onTransformChange: (tr) => { setTransform(tr); options.onTransformChange?.(tr); } });
  onCleanup(() => controller.destroy());
  return { transform, controller };
}
export function createAudioPlayer(options: AudioPlayerOptions = {}) {
  const [state, setState] = createSignal({ playing: false, muted: false, currentTime: 0, duration: options.duration ?? 0, volume: options.volume ?? 1, playbackRate: options.playbackRate ?? 1 });
  const controller = createAudioPlayerController({ ...options, onStateChange: (s) => { setState({ ...s }); options.onStateChange?.(s); } });
  onCleanup(() => controller.destroy());
  return { state, controller };
}
export function createCodeGutter(options: CodeGutterOptions) {
  const controller = createCodeGutterController(options);
  onCleanup(() => controller.destroy());
  return { controller };
}
export function createWizardDialog(options: WizardDialogOptions) {
  const controller = createWizardDialogController(options);
  onCleanup(() => controller.destroy());
  return { controller };
}
