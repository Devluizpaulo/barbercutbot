import { test, expect } from '@playwright/test';

test('admin login flow', async ({ page }) => {
  // Navigate to the admin login page
  await page.goto('/cpanel/login');

  // Fill in the email and password
  await page.getByLabel('Email').fill('admin@flowcutspro.com');
  await page.getByLabel('Senha').fill('password');

  // Click the login button
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Wait for navigation and check if the dashboard title is visible
  await expect(page.getByRole('heading', { name: 'Painel do Administrador' })).toBeVisible();

  // Check if the URL is the admin dashboard
  await expect(page).toHaveURL('/cpanel');
});
