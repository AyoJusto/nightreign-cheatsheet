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

    // Labels speak player vocabulary; data-slot says which place a pin is.
    await page.getByRole('button', { name: /^Possible spawn point, leaves / }).and(page.locator(`[data-slot="${target.spawn}"]`)).click()

    for (const [slot, key] of Object.entries<string | null>(target.slots)) {
      if (/\/seed\//.test(page.url())) break
      const pin = page.getByRole('button', { name: 'Unknown site', exact: true }).and(page.locator(`[data-slot="${slot}"]`))
      if (!(await pin.isVisible())) continue // certain or empty slots cannot narrow further
      await pin.click()
      const option = key ? `${structureName(key)}, leaves` : 'Nothing here, leaves'
      await page.locator(`.options[data-slot="${slot}"]`).getByRole('button', { name: new RegExp(`^${escapeRe(option)}`) }).click()
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
  await frame.evaluate((el) => el.querySelectorAll<HTMLElement>('.pin-hit').forEach((pin) => { pin.scrollIntoView(); pin.focus() }))
  expect(await frame.evaluate((el) => [el.scrollLeft, el.scrollTop])).toEqual([0, 0])

  // Tap the first spawn option that is on screen, by its point, and expect that exact spawn.
  const viewport = page.viewportSize()!
  for (const pin of await page.getByRole('button', { name: /^Possible spawn point, / }).all()) {
    const box = (await pin.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    if (x < 30 || y < 90 || x > viewport.width - 30 || y > viewport.height - 110) continue
    const slot = (await pin.getAttribute('data-slot'))!
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
  await page.getByRole('button', { name: 'Unknown site', exact: true }).first().click()
  const list = page.locator('.options')
  await expect(page.getByRole('button', { name: "Resize What's here?, half open" })).toBeVisible()
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

// The grab handle steps detents from the keyboard, and full docks flush below the pill.
test('the result sheet steps with the keyboard and opens fully flush below the pill', async ({ page, isMobile }) => {
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
  await page.waitForTimeout(1500) // let the no-bounce spring settle fully
  const [pill, sheet] = await page.evaluate(() => ['.pill', '.sheet'].map((s) => document.querySelector(s)!.getBoundingClientRect()))
  // Flush: at or just below the pill's bottom edge, never above it and never with a visible gap
  // (the old 8px float gap this used to assert is gone; a couple of px covers rounding, not a sliver).
  expect(sheet.top).toBeGreaterThanOrEqual(pill.bottom - 0.5)
  expect(sheet.top).toBeLessThan(pill.bottom + 3)
})

// A tap selects a site; the sheet then rises over the lower part of the map, and the map must lift the
// selected pin above it. (A tap once left the map thinking a drag was still under way, so it never lifted.)
test('a low site stays in sight above its sheet', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the sheet is phone only')
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  await expect(page.getByRole('button', { name: 'Unknown site', exact: true }).first()).toBeVisible()
  await page.waitForTimeout(700) // let the map frame itself
  const viewport = page.viewportSize()!
  let lowest = null
  let lowestY = 0
  for (const pin of await page.getByRole('button', { name: 'Unknown site', exact: true }).all()) {
    const box = (await pin.boundingBox())!
    // On screen and above the strip, but low enough that the half sheet would cover it.
    if (box.y > lowestY && box.y + box.height < viewport.height - 110) { lowest = pin; lowestY = box.y }
  }
  await lowest!.click()
  await page.waitForTimeout(900) // the sheet rises, then the map follows
  const [pin, sheet] = await page.evaluate(() => ['.pin-selected', '.sheet'].map((s) => document.querySelector(s)!.getBoundingClientRect()))
  expect(lowestY + 22).toBeGreaterThan(sheet.top) // the sheet would have covered it
  expect(pin.top + pin.height / 2).toBeLessThan(sheet.top)
})

// Closing the slot sheet slides it off on its spring (or fades it, under reduced motion); it once
// vanished in a single frame (iter-6 M1). Sampled in the page, per frame, from the moment of the close.
for (const reduced of [false, true]) {
  test(`the slot sheet leaves on close, not in one frame${reduced ? ' (reduced motion)' : ''}`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'the sheet is phone only')
    if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
    await page.getByRole('button', { name: 'Unknown site', exact: true }).first().click()
    await expect(page.getByRole('button', { name: "Resize What's here?, half open" })).toBeVisible()
    await page.waitForTimeout(900) // let the sheet rise and settle
    const samples = await page.evaluate(() => new Promise<{ t: number; top: number | null; opacity: number | null }[]>((resolve) => {
      const out: { t: number; top: number | null; opacity: number | null }[] = []
      const sample = (t: number) => {
        const sheet = document.querySelector('.sheet')
        const layer = sheet?.querySelector<HTMLElement>('.sheet-solid')
        out.push({ t, top: sheet ? sheet.getBoundingClientRect().top : null, opacity: layer ? parseFloat(getComputedStyle(layer).opacity) : null })
      }
      sample(0)
      dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      const start = performance.now()
      const tick = () => {
        const t = performance.now() - start
        sample(t)
        if (t < 1500) requestAnimationFrame(tick)
        else resolve(out)
      }
      requestAnimationFrame(tick)
    }))
    const at = (ms: number) => samples.find((s) => s.t >= ms)!
    const open = samples[0]
    // Still there and on its way out about 100ms after the close...
    expect(at(100).top).not.toBeNull()
    if (reduced) {
      expect(at(100).top).toBe(open.top) // opacity only, it does not slide
      expect(at(100).opacity!).toBeLessThan(open.opacity!)
    } else {
      expect(at(100).top!).toBeGreaterThan(open.top! + 5)
      expect(at(100).top!).toBeLessThan(page.viewportSize()!.height)
    }
    // ...and gone once its spring has settled (about 1s; it is off-screen well before).
    expect(at(1300).top).toBeNull()
  })
}

// The live region speaks the count as a phrase, never a bare number (iter-6 m3).
test('the count is announced as a full phrase', async ({ page, isMobile }) => {
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  const live = page.locator('[aria-live]')
  await expect(live).toHaveText(isMobile ? /^Tap where you spawned, \d+ possible$/ : /^\d+ possible$/)
  await page.getByRole('button', { name: /^Possible spawn point, leaves / }).first().click()
  await expect(live).toHaveText(/^\d+ possible$/)
})

// Desktop: selecting a site should not force a keyboard user to tab past every other pin to reach its
// options, and closing it should not drop focus to the document body (m5).
test('desktop: selecting a site focuses its first option, and Escape returns focus to the pin', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the side panel is desktop only')
  const target = targets[0]
  await page.goto(`/find/${target.nightlord}/${target.earth}`)
  const pin = page.getByRole('button', { name: 'Unknown site', exact: true }).first()
  await pin.click()
  await expect(page.locator('.options').getByRole('button').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(pin).toBeFocused()
})

// Result pins do nothing when clicked, so they are named images, not buttons Tab would walk through.
test('result map pins are named images, not buttons', async ({ page }) => {
  await page.goto(`/seed/${targets[0].id}`)
  await expect(page.getByRole('img', { name: 'Spawn point' })).toBeAttached()
  await expect(page.locator('.map-frame button')).toHaveCount(0)
})
