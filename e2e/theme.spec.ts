import { test, expect } from '@playwright/test'

test('pages paint in Graphite', async ({ page }) => {
  await page.goto('#/nightlord/tricephalos')
  const ground = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  expect(ground).toBe('rgb(11, 11, 12)')
  const holy = page.getByRole('row', { name: /^Holy/ })
  await expect(holy.getByRole('cell')).toHaveCSS('color', 'rgb(242, 194, 110)')
  await expect(page.getByRole('row', { name: /^Madness/ }).getByRole('cell')).toHaveCSS('color', 'rgb(255, 122, 107)')
})
