import { expect, test } from '@playwright/test';

test('homepage has navbar', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('nav')).toBeVisible();
});
