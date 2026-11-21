import {
  createAudioPlayerController, createDiffViewerController, createDockController,
  createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type DiffViewerOptions, type DockOptions,
  type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';
import { createResumableBinding } from './index';

export function createQwikDock(options: DockOptions) {
  return createResumableBinding({ activePaneId: options.activePaneId ?? options.panes[0]?.id ?? null }, (s) =>
    createDockController({ ...options, activePaneId: s.activePaneId, onChange: (p, a) => { s.activePaneId = a; options.onChange?.(p, a); } }),
  );
}
export function createQwikTimeline(options: TimelineOptions) {
  return createResumableBinding({ playhead: options.playhead ?? options.minTime }, (s) =>
    createTimelineController({ ...options, playhead: s.playhead, onPlayheadChange: (t) => { s.playhead = t; options.onPlayheadChange?.(t); } }),
  );
}
export function createQwikDiffViewer(options: DiffViewerOptions) {
  return createResumableBinding({ viewMode: options.viewMode ?? 'unified' }, () => createDiffViewerController(options));
}
export function createQwikSpatialCanvas(options: SpatialCanvasOptions = {}) {
  return createResumableBinding({ x: options.initial?.x ?? 0, y: options.initial?.y ?? 0, zoom: options.initial?.zoom ?? 1 }, (s) =>
    createSpatialCanvasController({ ...options, initial: s, onTransformChange: (tr) => { s.x = tr.x; s.y = tr.y; s.zoom = tr.zoom; options.onTransformChange?.(tr); } }),
  );
}
export function createQwikAudioPlayer(options: AudioPlayerOptions = {}) {
  return createResumableBinding({ playing: false, currentTime: 0 }, (s) =>
    createAudioPlayerController({ ...options, onStateChange: (st) => { s.playing = st.playing; s.currentTime = st.currentTime; options.onStateChange?.(st); } }),
  );
}
export function createQwikWizardDialog(options: WizardDialogOptions) {
  return createResumableBinding({ open: false }, () => createWizardDialogController(options));
}
