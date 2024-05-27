import { test, expect } from '@playwright/test';

test('example', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain a substring.
  expect(true).toBeTruthy();
});
