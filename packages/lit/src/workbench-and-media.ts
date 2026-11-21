import type { ReactiveControllerHost } from 'lit';
import {
  createAudioPlayerController, createCodeGutterController, createDiffViewerController, createDockController,
  createMentionController, createSpatialCanvasController, createTimelineController, createWizardDialogController,
  type AudioPlayerOptions, type CodeGutterOptions, type DiffViewerOptions, type DockOptions,
  type MentionOptions, type SpatialCanvasOptions, type TimelineOptions, type WizardDialogOptions,
} from '@forma-ui/core';
import { FormaCallbackBridge } from './index';

export const createLitDock = (host: ReactiveControllerHost, options: DockOptions) =>
  new FormaCallbackBridge(host, (notify) => createDockController({ ...options, onChange: (p, a) => { notify(); options.onChange?.(p, a); } }));
export const createLitTimeline = (host: ReactiveControllerHost, options: TimelineOptions) =>
  new FormaCallbackBridge(host, (notify) => createTimelineController({ ...options, onPlayheadChange: (t) => { notify(); options.onPlayheadChange?.(t); } }));
export const createLitDiffViewer = (host: ReactiveControllerHost, options: DiffViewerOptions) =>
  new FormaCallbackBridge(host, () => createDiffViewerController(options));
export const createLitMention = (host: ReactiveControllerHost, options: MentionOptions) =>
  new FormaCallbackBridge(host, (notify) => createMentionController({ ...options, onSelect: (c, t, cur) => { notify(); options.onSelect?.(c, t, cur); } }));
export const createLitSpatialCanvas = (host: ReactiveControllerHost, options: SpatialCanvasOptions = {}) =>
  new FormaCallbackBridge(host, (notify) => createSpatialCanvasController({ ...options, onTransformChange: (tr) => { notify(); options.onTransformChange?.(tr); } }));
export const createLitAudioPlayer = (host: ReactiveControllerHost, options: AudioPlayerOptions = {}) =>
  new FormaCallbackBridge(host, (notify) => createAudioPlayerController({ ...options, onStateChange: (s) => { notify(); options.onStateChange?.(s); } }));
export const createLitCodeGutter = (host: ReactiveControllerHost, options: CodeGutterOptions) =>
  new FormaCallbackBridge(host, (notify) => createCodeGutterController({ ...options, onChange: () => { notify(); options.onChange?.(); } }));
export const createLitWizardDialog = (host: ReactiveControllerHost, options: WizardDialogOptions) =>
  new FormaCallbackBridge(host, (notify) => createWizardDialogController({ ...options, onClose: () => { notify(); options.onClose?.(); } }));
