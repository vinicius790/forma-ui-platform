/**
 * Forma UI 50.0.0 Declarative Shadow DOM (DSD) serialization, CSP-nonce hydration script tags,
 * and deterministic FNV-1a render-tree hashing.
 */
import { serializeHydrationState } from './index';

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
}

/**
 * Wraps HTML and optional scoped CSS in a standards-compliant Declarative Shadow DOM `<template>`.
 */
export function renderDeclarativeShadowDom(
  html: string,
  css?: string,
  mode: 'open' | 'closed' = 'open',
): string {
  const shadowMode = mode === 'closed' ? 'closed' : 'open';
  const styleTag = css && css.trim().length > 0 ? `<style>${css}</style>` : '';
  return `<template shadowrootmode="${shadowMode}">${styleTag}${html}</template>`;
}

/**
 * Emits an XSS-safe `<script type="application/json">` hydration payload element with optional CSP nonce.
 */
export function createHydrationScriptTag(
  id: string,
  payload: unknown,
  nonce?: string,
): string {
  const safeId = escapeHtmlAttr(id);
  const nonceAttr = nonce ? ` nonce="${escapeHtmlAttr(nonce)}"` : '';
  const body = serializeHydrationState(payload);
  return `<script id="${safeId}" type="application/json"${nonceAttr}>${body}</script>`;
}

/**
 * Computes a deterministic 32-bit FNV-1a hexadecimal hash for SSR render-tree mismatch detection.
 */
export function hashRenderTree(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
