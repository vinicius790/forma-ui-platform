import { useEffect, useReducer, useRef } from 'preact/hooks';
import {
  createCollapsibleController,
  createDrawerController,
  createHoverCardController,
  createPopoverController,
  createSplitterController,
  type CollapsibleOptions,
  type DrawerOptions,
  type HoverCardOptions,
  type PopoverOptions,
  type SplitterOptions,
} from '@forma-ui/core';

export function useCollapsible(options: CollapsibleOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ref = useRef(
    createCollapsibleController({
      ...options,
      onOpenChange: (next) => {
        bump(undefined);
        options.onOpenChange?.(next);
      },
    }),
  );
  useEffect(() => () => ref.current.destroy(), []);
  return ref.current;
}

export function usePopover(options: PopoverOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ref = useRef(
    createPopoverController({
      ...options,
      onOpenChange: (next) => {
        bump(undefined);
        options.onOpenChange?.(next);
      },
    }),
  );
  useEffect(() => () => ref.current.destroy(), []);
  return ref.current;
}

export function useDrawer(options: DrawerOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ref = useRef(
    createDrawerController({
      ...options,
      onOpenChange: (next) => {
        bump(undefined);
        options.onOpenChange?.(next);
      },
    }),
  );
  useEffect(() => () => ref.current.destroy(), []);
  return ref.current;
}

export function useSplitter(options: SplitterOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ref = useRef(
    createSplitterController({
      ...options,
      onValueChange: (next) => {
        bump(undefined);
        options.onValueChange?.(next);
      },
    }),
  );
  useEffect(() => () => ref.current.destroy(), []);
  return ref.current;
}

export function useHoverCard(options: HoverCardOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ref = useRef(
    createHoverCardController({
      ...options,
      onOpenChange: (next) => {
        bump(undefined);
        options.onOpenChange?.(next);
      },
    }),
  );
  useEffect(() => () => ref.current.destroy(), []);
  return ref.current;
}
