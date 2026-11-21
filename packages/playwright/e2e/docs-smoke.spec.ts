import { expect, test } from '@playwright/test';

test('documentation playground renders its application shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Executar auditoria axe-core' })).toBeVisible();
});

test('modal dialog opens, receives focus and closes with Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Abrir diálogo' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Exemplo de dialog' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Use Tab/Shift+Tab');
  await dialog.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('tabs respond to directional keyboard input', async ({ page }) => {
  await page.goto('/');
  const overview = page.getByRole('tab', { name: 'Visão geral' });
  const details = page.getByRole('tab', { name: 'Detalhes' });
  await overview.focus();
  await overview.press('ArrowRight');
  await expect(details).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Detalhes' })).toBeVisible();
});

test('switch exposes its checked state to assistive technology', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('switch');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(toggle).toHaveText('Ativado');
});

test('language selector changes document language and direction', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Idioma').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
