import { test, expect } from '@playwright/test'

const tapMarker = async (page: import('@playwright/test').Page, name: string) => {
  const icon = page.locator('.marker-boss').filter({ hasText: name }).locator('.marker-icon')
  const r = (await icon.boundingBox())!
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2)
}

test('a tap on a field boss shows what it is weak to', async ({ page }) => {
  await page.goto('#/seed/000')
  await page.waitForTimeout(600)
  await tapMarker(page, 'Golden Hippopotamus')
  const card = page.getByRole('dialog', { name: 'Golden Hippopotamus' })
  await expect(card).toBeVisible()
  await expect(card.getByRole('heading', { name: 'Golden Hippopotamus' })).toBeVisible()
  await expect(card.getByText('Weak', { exact: true })).toBeVisible()
  await expect(card.getByText('Sleep, Madness')).toBeVisible()
  await expect(card.getByRole('link', { name: 'All numbers' })).toHaveAttribute('href', '#/enemy/golden-hippopotamus')
})

test('the close button and Escape put the card away', async ({ page }) => {
  await page.goto('#/seed/000')
  await page.waitForTimeout(600)
  await tapMarker(page, 'Golden Hippopotamus')
  await page.getByRole('button', { name: 'Close Golden Hippopotamus' }).click()
  await expect(page.getByRole('dialog', { name: 'Golden Hippopotamus' })).toHaveCount(0)
  await tapMarker(page, 'Golden Hippopotamus')
  await expect(page.getByRole('dialog', { name: 'Golden Hippopotamus' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Golden Hippopotamus' })).toHaveCount(0)
})

test("a night's boss in the seed's details opens its card", async ({ page, isMobile }) => {
  await page.goto('#/seed/000')
  if (isMobile) {
    const handle = page.getByRole('button', { name: /^Resize Seed details/ })
    await handle.focus()
    await handle.press('ArrowUp')
  }
  await page.getByRole('button', { name: 'Tree Sentinel and Royal Cavalrymen' }).click()
  await expect(page.getByRole('dialog', { name: 'Tree Sentinel & Royal Cavalrymen' })).toBeVisible()
})
