import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
// Use the domain's own names so the test speaks the ubiquitous language, not a copy of it.
import { structureName, nightlordName, earthName } from '../src/domain/names'

const data = JSON.parse(readFileSync('src/data/seeds.json', 'utf8'))

// One base-game seed and one DLC Great Hollow seed.
const targets = [
  data.seeds.find((s: any) => s.nightlord === 'tricephalos' && s.earth === 'default'),
  data.seeds.find((s: any) => s.nightlord === 'dreglord' && s.earth === 'great-hollow'),
]

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

for (const target of targets) {
  test(`finds seed ${target.id} from home`, async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: new RegExp(`^${nightlordName(target.nightlord)}`) }).click()
    await page.getByRole('button', { name: new RegExp(`^${earthName(target.earth)}`) }).click()
    await expect(page).toHaveURL(new RegExp(`/find/${target.nightlord}/${target.earth}`))

    await page.getByRole('button', { name: new RegExp(`^Spawn point, slot ${target.spawn},`) }).click()

    for (const [slot, key] of Object.entries<string | null>(target.slots)) {
      if (/\/seed\//.test(page.url())) break
      const pin = page.getByRole('button', { name: `Slot ${slot}`, exact: true })
      if (!(await pin.isVisible())) continue // certain or empty slots cannot narrow further
      await pin.click()
      const option = key ? `${structureName(key)}, leaves` : 'Nothing here, leaves'
      await page.getByRole('list', { name: `Slot ${slot}` }).getByRole('button', { name: new RegExp(`^${escapeRe(option)}`) }).click()
    }

    await expect(page).toHaveURL(new RegExp(`/seed/${target.id}`), { timeout: 5000 })
    await expect(page.getByRole('heading', { name: `Seed ${target.id}` })).toBeVisible()
  })
}

test('a shared seed link opens directly', async ({ page }) => {
  await page.goto(`/seed/${targets[0].id}`)
  await expect(page.getByRole('heading', { name: `Seed ${targets[0].id}` })).toBeVisible()
})

// Focus or scrollIntoView on an off-screen pin must not scroll the map frame: taps are resolved
// from the frame's geometry, so a scrolled frame would send them to the wrong slot.
test('the map frame never scrolls under the map, so taps still land', async ({ page }) => {
  const target = targets[0]
  await page.goto(`/find/${target.nightlord}/${target.earth}`)
  const frame = page.locator('.map-frame')
  // Zoom in so some pins sit off-screen.
  await frame.evaluate((el) => {
    const r = el.getBoundingClientRect()
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -500, clientX: r.width / 2, clientY: r.height / 2, bubbles: true, cancelable: true }))
  })
  await page.waitForTimeout(600)
  await frame.evaluate((el) => el.querySelectorAll<HTMLElement>('.pin').forEach((pin) => { pin.scrollIntoView(); pin.focus() }))
  expect(await frame.evaluate((el) => [el.scrollLeft, el.scrollTop])).toEqual([0, 0])

  // Tap the first spawn option that is on screen, by its point, and expect that exact spawn.
  const viewport = page.viewportSize()!
  for (const pin of await page.getByRole('button', { name: /^Spawn point, slot / }).all()) {
    const box = (await pin.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    if (x < 30 || y < 90 || x > viewport.width - 30 || y > viewport.height - 110) continue
    const slot = (await pin.getAttribute('aria-label'))!.match(/slot (\d+)/)![1]
    await page.mouse.click(x, y)
    await expect(page).toHaveURL(new RegExp(`s=spawn(%40|@)${slot}$`))
    return
  }
  throw new Error('no spawn option on screen')
})

// At half the sheet body scrolls, and its scroll range ends on screen, so the last option needs no drag.
test('a slot sheet at half scrolls to its last option', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the sheet is phone only')
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  await page.getByRole('button', { name: /^Slot \d+$/ }).first().click()
  const list = page.getByRole('list', { name: /^Slot / })
  await expect(page.getByRole('button', { name: /^Resize Slot .*, half open$/ })).toBeVisible()
  await page.waitForTimeout(700) // let the sheet rise
  const last = await list.evaluate((el) => {
    const body = el.closest('.sheet-body') as HTMLElement
    body.scrollTop = body.scrollHeight
    const option = el.querySelector('li:last-child button')!.getBoundingClientRect()
    return { overflow: getComputedStyle(body).overflowY, bottom: option.bottom, top: option.top, sheetTop: body.closest('.sheet')!.getBoundingClientRect().top }
  })
  expect(last.overflow).toBe('auto')
  expect(last.bottom).toBeLessThanOrEqual(page.viewportSize()!.height)
  expect(last.top).toBeGreaterThan(last.sheetTop)
})

// The grab handle steps detents from the keyboard, and full stops below the pill.
test('the result sheet steps with the keyboard and opens fully below the pill', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the sheet is phone only')
  await page.goto(`/seed/${targets[0].id}`)
  // The name carries the detent, so match the handle by its prefix.
  const handle = page.getByRole('button', { name: /^Resize Seed details/ })
  await expect(handle).toHaveAccessibleName('Resize Seed details, collapsed')
  await handle.focus()
  await handle.press('ArrowUp')
  await expect(handle).toHaveAccessibleName('Resize Seed details, half open')
  await handle.press('ArrowUp')
  await expect(handle).toHaveAccessibleName('Resize Seed details, fully open')
  await expect(handle).toBeFocused()
  await page.waitForTimeout(700)
  const [pill, sheet] = await page.evaluate(() => ['.pill', '.sheet'].map((s) => document.querySelector(s)!.getBoundingClientRect()))
  expect(sheet.top).toBeGreaterThanOrEqual(pill.bottom + 7.5)
})
