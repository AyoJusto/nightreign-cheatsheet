import { test, expect } from '@playwright/test'

test('opens About from home and returns', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Nightreign' })).toBeVisible()
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/#\/about$/)
  await expect(page.getByText('Find your Nightreign seed mid-run, see its whole map, and look up what every boss on it is weak to.')).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Nightreign' })).toBeVisible()
})
