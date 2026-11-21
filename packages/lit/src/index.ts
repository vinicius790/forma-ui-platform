import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { registerHotkeys, type HotkeyBinding } from '@forma-ui/core';

export interface SubscribableController {
  subscribe?: (listener: () => void) => () => void;
  destroy?: () => void;
}

/** Connects a core controller/store to Lit's reactive update cycle without coupling core to Lit. */
export class FormaControllerBridge<T extends SubscribableController> implements ReactiveController {
  private unsubscribe?: () => void;
  constructor(
    private readonly host: ReactiveControllerHost,
    readonly controller: T,
    private readonly afterChange?: (controller: T) => void,
  ) {
    host.addController(this);
  }
  hostConnected(): void {
    this.hostDisconnected();
    this.unsubscribe = this.controller.subscribe?.(() => {
      this.afterChange?.(this.controller);
      this.host.requestUpdate();
    });
  }
  hostDisconnected(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
  destroy(): void {
    this.hostDisconnected();
    this.controller.destroy?.();
  }
}

/** Bridges any callback-driven `@forma-ui/core` controller into a Lit host with automatic lifecycle teardown. */
export class FormaCallbackBridge<T extends { destroy?: () => void }> implements ReactiveController {
  readonly controller: T;
  constructor(
    private readonly host: ReactiveControllerHost,
    factory: (notify: () => void) => T,
  ) {
    this.controller = factory(() => this.host.requestUpdate());
    host.addController(this);
  }
  hostDisconnected(): void {
    this.controller.destroy?.();
  }
}

/** Lit ReactiveController for declarative, leak-free keyboard shortcuts. */
export class FormaHotkeysController implements ReactiveController {
  private stop?: () => void;
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly bindings: readonly HotkeyBinding[],
    private readonly target?: EventTarget | null,
  ) {
    host.addController(this);
  }
  hostConnected(): void {
    this.hostDisconnected();
    this.stop = registerHotkeys(this.bindings, this.target);
  }
  hostDisconnected(): void {
    this.stop?.();
    this.stop = undefined;
  }
}

export interface FormaChangeDetail<T> {
  value: T;
  source: 'user' | 'programmatic';
}

export function dispatchFormaChange<T>(
  target: EventTarget,
  name: string,
  value: T,
  source: FormaChangeDetail<T>['source'] = 'user',
): boolean {
  const event = new CustomEvent<FormaChangeDetail<T>>(name, { detail: { value, source }, bubbles: true, composed: true });
  return target.dispatchEvent(event);
}

export function defineOnce(
  name: string,
  constructor: CustomElementConstructor,
  registry?: CustomElementRegistry,
): boolean {
  const target = registry ?? (typeof customElements === 'undefined' ? undefined : customElements);
  if (!target) throw new Error('Custom Elements are unavailable in this environment.');
  if (target.get(name)) return false;
  target.define(name, constructor);
  return true;
}

export * from './enterprise-and-boards';
export * from './workbench-and-media';
