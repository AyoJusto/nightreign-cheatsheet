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
  await page.getByRole('button', { name: 'Fist', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Fist', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test("Back from a boss's page returns to the seed it was opened from", async ({ page }) => {
  await page.goto('#/seed/000')
  await page.waitForTimeout(600)
  const icon = page.locator('.marker-boss').filter({ hasText: 'Golden Hippopotamus' }).locator('.marker-icon')
  const r = (await icon.boundingBox())!
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2)
  await page.getByRole('link', { name: 'All numbers' }).click()
  await expect(page).toHaveURL(/#\/enemy\/golden-hippopotamus$/)
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/#\/seed\/000$/)
})

test('Back steps back through history rather than stacking pages', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Bosses' }).click()
  const length = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Nightreign' })).toBeVisible()
  expect(await page.evaluate(() => history.length)).toBe(length)
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Bosses' })).toBeVisible()
})

test('the Nightlord picker leads back home', async ({ page }) => {
  await page.goto('#/find')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Nightreign' })).toBeVisible()
})

test('a swipe down puts the Shifting Earth panel away and clears the pick', async ({ page, isMobile }) => {
  test.skip(isMobile, "Playwright's WebKit mouse does not drive Motion drags; Chromium at phone width does")
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('#/find')
  await page.getByRole('button', { name: /^Tricephalos/ }).click()
  const heading = page.getByRole('heading', { name: 'Shifting Earth' })
  await expect(heading).toBeVisible()
  await page.waitForTimeout(600)
  const handle = (await page.locator('.earth-bar-handle').boundingBox())!
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 2)
  await page.mouse.down()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 160, { steps: 8 })
  await page.mouse.up()
  await expect(heading).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Tricephalos/ })).toHaveAttribute('aria-pressed', 'false')
})
