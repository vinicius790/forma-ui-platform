export function renderTokenVisualizer(target: HTMLElement): void {
  const properties = ['--forma-color-surface', '--forma-color-text', '--forma-color-muted', '--forma-color-border', '--forma-color-focus', '--forma-color-primary', '--forma-color-danger'];
  target.replaceChildren();
  const list = document.createElement('ul');
  for (const property of properties) { const item = document.createElement('li'); const swatch = document.createElement('span'); swatch.className = 'token-swatch'; swatch.style.background = `var(${property}, transparent)`; const label = document.createElement('code'); label.textContent = property; const value = document.createElement('output'); value.textContent = getComputedStyle(document.documentElement).getPropertyValue(property).trim() || '(não definido)'; item.append(swatch, label, ' — ', value); list.append(item); }
  target.append(list);
}
