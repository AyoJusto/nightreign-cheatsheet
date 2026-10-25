import { test, expect } from './test'

test('typing on in home search keeps the rows that still match instead of remounting them', async ({ page }) => {
  await page.goto('./')
  const search = page.getByRole('searchbox', { name: 'Search bosses and relic effects' })
  await search.fill('vig')
  const row = page.getByRole('button', { name: /^Vigor \+1\/2\/3/ })
  await row.click()
  await expect(row).toHaveAttribute('aria-expanded', 'true')
  await search.fill('vigo')
  await expect(page.getByRole('button', { name: /^Vigor \+1\/2\/3/ })).toHaveAttribute('aria-expanded', 'true')
})

test('an effect row grows open instead of jumping, and folds away again', async ({ page }) => {
  await page.goto('#/effects/relics')
  const row = page.getByRole('button', { name: /^Vigor \+1\/2\/3/ })
  await row.click()
  const details = page.getByText('+20 / +40 / +60 Max HP')
  const clip = details.locator('xpath=ancestor::div[contains(@class, "overflow-hidden")][1]')
  const early = await clip.evaluate((el) => el.getBoundingClientRect().height)
  await page.waitForTimeout(800)
  const settled = await clip.evaluate((el) => el.getBoundingClientRect().height)
  expect(settled).toBeGreaterThan(0)
  expect(early).toBeLessThan(settled)
  await row.click()
  await expect(details).toHaveCount(0)
})

test('with reduced motion an effect row opens at full height at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('#/effects/relics')
  await page.getByRole('button', { name: /^Vigor \+1\/2\/3/ }).click()
  const clip = page.getByText('+20 / +40 / +60 Max HP').locator('xpath=ancestor::div[contains(@class, "overflow-hidden")][1]')
  await expect.poll(() => clip.evaluate((el) => Math.abs(el.getBoundingClientRect().height - el.scrollHeight) < 1)).toBe(true)
  const height = await clip.evaluate((el) => el.getBoundingClientRect().height)
  await page.waitForTimeout(300)
  expect(await clip.evaluate((el) => el.getBoundingClientRect().height)).toBe(height)
})
