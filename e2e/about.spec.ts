import { test, expect } from '@playwright/test'

test('home says it is not affiliated, with no About link', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText('Not affiliated with FromSoftware or Bandai Namco. Game art belongs to its owners.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'About' })).toHaveCount(0)
})

test('the About page still opens from an old link', async ({ page }) => {
  await page.goto('#/about')
  await expect(page.getByText('Find your Nightreign seed mid-run, see its whole map, and look up what every boss on it is weak to.')).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Nightreign' })).toBeVisible()
})
