import { test, expect } from './test'

test('home search finds bosses and relic effects', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('searchbox', { name: 'Search bosses and relic effects' }).fill('hippo')
  await expect(page.getByRole('link', { name: /^Golden Hippopotamus/ })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search bosses and relic effects' }).fill('vigor')
  await page.getByRole('button', { name: /^Vigor \+1\/2\/3/ }).click()
  await expect(page.getByText('+20 / +40 / +60 Max HP')).toBeVisible()
})

test('a Nightlord picked on home shows its Shifting Earth right there', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Augur', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Augur', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Shifting Earth' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Find My Seed' })).toBeVisible()
  await expect(page).toHaveURL(/#\/find\/augur$/)
})

test('Unknown picked on home shows its Shifting Earth', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Unknown', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unknown', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Shifting Earth' })).toBeVisible()
})

test('Back from a map returns home with the Nightlord still picked', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Tricephalos', exact: true }).click()
  await page.locator('.earth').first().click()
  await expect(page).toHaveURL(/#\/find\/tricephalos\/[^/?]+$/)
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/#\/find\/tricephalos$/)
  await expect(page.getByRole('button', { name: 'Tricephalos', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Find My Seed' })).toBeVisible()
})

test('home never scrolls sideways and links every section', async ({ page }) => {
  await page.goto('./')
  for (const name of ['Nightlords', 'Bosses', 'Relic Effects', 'Weapon Effects', 'Builds']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test("the old cheat sheet's links still open their pages", async ({ page }) => {
  await page.goto('#/tricephalos')
  await expect(page.getByRole('heading', { name: 'Tricephalos', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Weak to' }).getByRole('img', { name: 'Holy' })).toBeVisible()
  await page.goto('#/boss/ancient-dragon')
  await expect(page.getByRole('heading', { name: 'Ancient Dragon', level: 1 })).toBeVisible()
  await page.goto('#/builds/wylder')
  await expect(page.getByRole('heading', { name: 'Wylder', level: 1 })).toBeVisible()
})

test("an enemy page lists the expeditions a night boss closes a night in", async ({ page }) => {
  await page.goto('#/enemy/bell-bearing-hunter')
  await expect(page.getByRole('region', { name: 'Weak to' }).getByRole('img', { name: /^(Standard|Slash|Strike|Pierce|Magic|Fire|Lightning|Holy)$/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /^Tricephalos/ })).toBeVisible()
})

test('a Nightlord page leads with its art and weakness icons, then the tables, then the nights', async ({ page }) => {
  await page.goto('#/nightlord/tricephalos')
  await expect(page.locator('main img[src$="nightlords/tricephalos.webp"]')).toBeVisible()
  const weak = page.getByRole('region', { name: 'Weak to' })
  await expect(weak.getByRole('img', { name: 'Holy' })).toBeVisible()
  await expect(weak.getByRole('img', { name: 'Sleep' })).toBeVisible()
  await expect(weak).toHaveText('')
  expect(await page.getByRole('heading', { level: 2 }).allTextContents()).toEqual(['Damage negation', 'Status buildup', 'Night 1', 'Night 2'])
  await expect(page.getByRole('row', { name: /^Holy/ })).toHaveCSS('background-color', 'rgb(38, 34, 26)')
  await expect(page.getByRole('row', { name: /^Fire/ })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})

test('wide number tables never push the page sideways', async ({ page }) => {
  await page.goto('#/enemy/albinauric-archers')
  await expect(page.getByRole('heading', { name: 'Damage negation' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('an enemy with no numbers says so and shows no weakness row', async ({ page }) => {
  await page.goto('#/enemy/ancestral-followers')
  await expect(page.getByText('No numbers for this one yet.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Weak to' })).toHaveCount(0)
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

test('an old Find My Seed link opens home', async ({ page }) => {
  await page.goto('#/find')
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

test('a Nightlord named for a status shows that icon once', async ({ page }) => {
  await page.goto('#/nightlord/balancers')
  await expect(page.getByRole('region', { name: 'Weak to' }).getByRole('img', { name: 'Sleep' })).toHaveCount(1)
})

test('home says it is not affiliated', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText('Not affiliated with FromSoftware or Bandai Namco. Game art belongs to its owners.')).toBeVisible()
})
