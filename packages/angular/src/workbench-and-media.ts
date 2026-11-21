import { DestroyRef, inject, signal } from '@angular/core';
import {
  createAudioPlayerController, createCodeGutterController, createDiffViewerController, createDockController,
  createMentionController, createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type CodeGutterOptions, type DiffViewerOptions, type DockOptions,
  type MentionOptions, type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';
import { ownFormaController } from './index';

export function injectDock(options: DockOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const activePaneId = signal(options.activePaneId ?? options.panes[0]?.id ?? null);
  const controller = ownFormaController(() => createDockController({ ...options, onChange: (p, a) => { activePaneId.set(a); options.onChange?.(p, a); } }), destroyRef);
  return { activePaneId: activePaneId.asReadonly(), controller };
}
export function injectTimeline(options: TimelineOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const playhead = signal(options.playhead ?? options.minTime);
  const controller = ownFormaController(() => createTimelineController({ ...options, onPlayheadChange: (t) => { playhead.set(t); options.onPlayheadChange?.(t); } }), destroyRef);
  return { playhead: playhead.asReadonly(), controller };
}
export function injectDiffViewer(options: DiffViewerOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  return { controller: ownFormaController(() => createDiffViewerController(options), destroyRef) };
}
export function injectMention(options: MentionOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  return { controller: ownFormaController(() => createMentionController(options), destroyRef) };
}
export function injectSpatialCanvas(options: SpatialCanvasOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const transform = signal({ x: options.initial?.x ?? 0, y: options.initial?.y ?? 0, zoom: options.initial?.zoom ?? 1 });
  const controller = ownFormaController(() => createSpatialCanvasController({ ...options, onTransformChange: (tr) => { transform.set(tr); options.onTransformChange?.(tr); } }), destroyRef);
  return { transform: transform.asReadonly(), controller };
}
export function injectAudioPlayer(options: AudioPlayerOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const state = signal({ playing: false, muted: false, currentTime: 0, duration: options.duration ?? 0, volume: options.volume ?? 1, playbackRate: options.playbackRate ?? 1 });
  const controller = ownFormaController(() => createAudioPlayerController({ ...options, onStateChange: (s) => { state.set({ ...s }); options.onStateChange?.(s); } }), destroyRef);
  return { state: state.asReadonly(), controller };
}
export function injectCodeGutter(options: CodeGutterOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  return { controller: ownFormaController(() => createCodeGutterController(options), destroyRef) };
}
export function injectWizardDialog(options: WizardDialogOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  return { controller: ownFormaController(() => createWizardDialogController(options), destroyRef) };
}
