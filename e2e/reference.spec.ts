import { test, expect } from '@playwright/test'

test('home search finds bosses and relic effects', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('searchbox', { name: 'Search bosses and relic effects' }).fill('hippo')
  await expect(page.getByRole('link', { name: /^Golden Hippopotamus/ })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search bosses and relic effects' }).fill('vigor')
  await page.getByRole('button', { name: /^Vigor \+1\/2\/3/ }).click()
  await expect(page.getByText('+20 / +40 / +60 Max HP')).toBeVisible()
})

test('Find My Seed opens the Nightlord picker', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Find My Seed' }).click()
  await expect(page.getByRole('heading', { name: 'Choose your Nightlord' })).toBeVisible()
})

test("the old cheat sheet's links still open their pages", async ({ page }) => {
  await page.goto('#/tricephalos')
  await expect(page.getByRole('heading', { name: 'Tricephalos', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Weak to' })).toContainText('Holy')
  await page.goto('#/boss/ancient-dragon')
  await expect(page.getByRole('heading', { name: 'Ancient Dragon', level: 1 })).toBeVisible()
  await page.goto('#/builds/wylder')
  await expect(page.getByRole('heading', { name: 'Wylder', level: 1 })).toBeVisible()
})

test("an enemy page lists the expeditions a night boss closes a night in", async ({ page }) => {
  await page.goto('#/enemy/bell-bearing-hunter')
  await expect(page.getByRole('region', { name: 'Weak to' })).toContainText('No damage weakness')
  await expect(page.getByRole('link', { name: /^Tricephalos/ })).toBeVisible()
})

test('a build switches between its loadouts', async ({ page }) => {
  await page.goto('#/builds/wylder')
  await page.getByRole('tab', { name: 'Fist' }).click()
  await expect(page.getByRole('tab', { name: 'Fist' })).toHaveAttribute('aria-selected', 'true')
})
