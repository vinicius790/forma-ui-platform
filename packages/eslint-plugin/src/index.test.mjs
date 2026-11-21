import test from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import plugin from './index.mjs';

function lint(code, ruleName) {
  const linter = new Linter();
  return linter.verify(code, [{
    languageOptions: { parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } },
    plugins: { forma: plugin },
    rules: { [`forma/${ruleName}`]: 'error' },
  }]);
}

test('button-type reports native JSX buttons without an explicit type', () => {
  assert.equal(lint('<button onClick={save}>Save</button>', 'button-type').length, 1);
  assert.equal(lint('<button type="button">Save</button>', 'button-type').length, 0);
});

test('no-positive-tabindex reports positive values but permits zero and negative values', () => {
  assert.equal(lint('<div tabIndex={2} />', 'no-positive-tabindex').length, 1);
  assert.equal(lint('<div tabIndex={0} />', 'no-positive-tabindex').length, 0);
  assert.equal(lint('<div tabIndex={-1} />', 'no-positive-tabindex').length, 0);
  assert.equal(lint('<div tabIndex="2" />', 'no-positive-tabindex').length, 1);
});

test('no-aria-hidden-focusable catches focusable hidden elements', () => {
  assert.equal(lint('<button aria-hidden="true" />', 'no-aria-hidden-focusable').length, 1);
  assert.equal(lint('<div aria-hidden="true" tabIndex={0} />', 'no-aria-hidden-focusable').length, 1);
  assert.equal(lint('<div aria-hidden="true" tabIndex={-1} />', 'no-aria-hidden-focusable').length, 0);
  assert.equal(lint('<div aria-hidden="true" />', 'no-aria-hidden-focusable').length, 0);
  assert.equal(lint('<button aria-hidden="false" />', 'no-aria-hidden-focusable').length, 0);
});

test('recommended flat config registers the plugin with the matching namespace', () => {
  assert.equal(plugin.configs.recommended.plugins.forma, plugin);
  assert.equal(plugin.configs.recommended.rules['forma/no-positive-tabindex'], 'error');
});

test('no-aria-hidden-focusable respects disabled controls and non-linked anchors', () => {
  assert.equal(lint('<button disabled aria-hidden="true" />', 'no-aria-hidden-focusable').length, 0);
  assert.equal(lint('<a aria-hidden="true">No link</a>', 'no-aria-hidden-focusable').length, 0);
  assert.equal(lint('<a href="/" aria-hidden="true">Link</a>', 'no-aria-hidden-focusable').length, 1);
});

test('valid-aria-role validates literal JSX role attributes against WAI-ARIA 1.2', () => {
  assert.equal(lint('<div role="dialog" />', 'valid-aria-role').length, 0);
  assert.equal(lint('<div role="treegrid grid" />', 'valid-aria-role').length, 0);
  assert.equal(lint('<div role="not-a-role" />', 'valid-aria-role').length, 1);
  assert.equal(lint('<div role="" />', 'valid-aria-role').length, 1);
  assert.equal(lint('<div role={dynamicRole} />', 'valid-aria-role').length, 0);
});

test('no-clickable-non-interactive flags div/span onClick without role, tabIndex and keyboard handler', () => {
  assert.equal(lint('<div onClick={run} />', 'no-clickable-non-interactive').length, 1);
  assert.equal(lint('<span onClick={run} role="button" />', 'no-clickable-non-interactive').length, 1);
  assert.equal(lint('<div onClick={run} role="button" tabIndex={0} />', 'no-clickable-non-interactive').length, 1);
  assert.equal(lint('<div onClick={run} role="button" tabIndex={0} onKeyDown={onKey} />', 'no-clickable-non-interactive').length, 0);
  assert.equal(lint('<button type="button" onClick={run}>OK</button>', 'no-clickable-non-interactive').length, 0);
});

test('plugin version is 50.0.0 and strict config enables v50 rules', () => {
  assert.equal(plugin.meta.version, '100.0.0');
  assert.equal(plugin.configs.strict.rules['forma/valid-aria-role'], 'error');
  assert.equal(plugin.configs.strict.rules['forma/no-clickable-non-interactive'], 'error');
});
