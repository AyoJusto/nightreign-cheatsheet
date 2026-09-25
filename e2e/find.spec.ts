import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
// Use the domain's own names so the test speaks the ubiquitous language, not a copy of it.
import { structureName, nightlordName, earthName, weaknessPhrase, DAMAGE_NAMES, type DamageKey } from '../src/domain/names'

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
  // Let the sheet rise: wait until it holds still for several frames, not a fixed time, since a slow
  // (software-rendered) frame rate stretches the spring's wall-clock time.
  await page.locator('.sheet').evaluate((el) => new Promise<void>((done) => {
    let last = NaN
    let still = 0
    const tick = () => {
      const top = el.getBoundingClientRect().top
      still = top === last ? still + 1 : 0
      last = top
      if (still >= 4) done()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }))
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

// Picking another site while the sheet is still leaving turns the one sheet around for the new site:
// no second sheet, and nothing left inert.
test('a site picked while the sheet is leaving reopens it for that site', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the sheet is phone only')
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  const sites = page.getByRole('button', { name: 'Unknown site', exact: true })
  const first = (await sites.nth(0).getAttribute('data-slot'))!
  const second = (await sites.nth(1).getAttribute('data-slot'))!
  await sites.nth(0).click()
  await expect(page.locator(`.options[data-slot="${first}"]`)).toBeVisible()
  await page.waitForTimeout(900) // let it rise and settle
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  await expect(page.locator('.sheet')).toHaveCount(1) // still leaving
  await sites.nth(1).click()
  await expect(page.locator('.sheet')).toHaveCount(1)
  await expect(page.locator('.sheet')).not.toHaveAttribute('inert')
  await expect(page.locator('.sheet .options')).toHaveAttribute('data-slot', second)
  await expect(page.locator('.pin-selected')).toHaveAttribute('data-slot', second)
  await page.waitForTimeout(900)
  // Settled at half and usable: its first option takes a tap.
  await expect(page.locator('.sheet')).toHaveCount(1)
  await expect(page.locator('.sheet .options button').first()).toBeInViewport()
  await expect(page.getByRole('button', { name: "Resize What's here?, half open" })).toBeVisible()
})

// The live region speaks the count as a phrase, never a bare number (iter-6 m3).
test('the count is announced as a full phrase', async ({ page, isMobile }) => {
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  const live = page.locator('[aria-live]')
  await expect(live).toHaveText(isMobile ? /^Tap where you spawned, \d+ possible$/ : /^\d+ possible$/)
  // The same live element must carry the new count: a remounted one arrives pre-filled and may go unannounced.
  await live.evaluate((el) => { el.dataset.probe = 'kept' })
  const spawn = page.getByRole('button', { name: /^Possible spawn point, leaves / }).first()
  const leaves = (await spawn.getAttribute('aria-label'))!.match(/leaves (\d+)/)![1]
  await spawn.click()
  await expect(live).toHaveText(`${leaves} possible`)
  await expect(live).toHaveAttribute('data-probe', 'kept')
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

// A sighted site's sheet marks what was recorded there, so the user can tell it from the alternatives (iter-10 m2).
test("a sighted site's sheet marks the recorded option as current", async ({ page }) => {
  const target = targets[0]
  await page.goto(`/find/${target.nightlord}/${target.earth}?s=spawn@${target.spawn},24@church`)
  await page.getByRole('button', { name: 'Church, sighted', exact: true }).click()
  const options = page.locator('.options')
  const current = options.getByRole('button', { name: /^Church, current, leaves \d+$/ })
  await expect(current.locator('.option-check')).toBeVisible()
  // Marked once: by name and checkmark, on one option only, and not also by aria-current (announced twice).
  await expect(options.getByRole('button', { name: /, current,/ })).toHaveCount(1)
  await expect(options.locator('.option-check')).toHaveCount(1)
  await expect(options.locator('[aria-current]')).toHaveCount(0)
})

// A slot sighted empty ("Nothing here") must not read as an unexplored site: it draws its own empty mark, not
// the unknown-site "?" orb (final I2).
test('a "Nothing here" sighting does not draw the unknown-site orb', async ({ page }) => {
  const target = targets[0]
  const emptySlot = Object.entries<string | null>(target.slots).find(([slot, key]) => key === null && slot !== target.spawn)![0]
  await page.goto(`/find/${target.nightlord}/${target.earth}?s=spawn@${target.spawn},${emptySlot}@none`)
  const pin = page.locator(`.pin[data-slot="${emptySlot}"]`)
  await expect(pin).toHaveClass(/\bpin-sighted\b/)
  await expect(pin.locator('img[src*="unknown.webp"]')).toHaveCount(0)
})

// A kind tile shows its elements as 14px emblems; hovering it names them, so no element rests on colour (iter-10 fix 2).
test('desktop: hovering a kind tile names its elements', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the side panel is desktop only')
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  const tile = page.locator('.structure-grid .strip-item[aria-expanded]').first()
  const types = (await tile.getAttribute('aria-label'))!.split(' types: ')[1]
  await tile.hover()
  await expect(page.locator('.structure-heading .structure-name')).toHaveText(new RegExp(`: ${escapeRe(types)}$`))
})

// An emblem that fails to load falls back to the element's two-letter code, so the element never drops silently (iter-10 fix 3).
test.describe(() => {
  // Requests the service worker makes are out of page.route's reach, so it is kept out of this test.
  test.use({ serviceWorkers: 'block' })
  test('a failed emblem falls back to its element code', async ({ page }) => {
    await page.route('**/elements/*.webp', (route) => route.abort())
    await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
    await page.getByRole('button', { name: 'Unknown site', exact: true }).first().click()
    const codes = page.locator('.options .element-code')
    await expect(codes.first()).toBeVisible()
    await expect(codes.first()).toHaveText(/^[A-Z][a-z]$/)
    await expect(page.locator('.options img.element-badge')).toHaveCount(0)
  })
})

// Result pins do nothing when clicked, so they are named images, not buttons Tab would walk through.
test('result map pins are named images, not buttons', async ({ page }) => {
  await page.goto(`/seed/${targets[0].id}`)
  await expect(page.getByRole('img', { name: 'Spawn point' })).toBeAttached()
  await expect(page.locator('.map-frame button')).toHaveCount(0)
})

// Every Rotted Woods seed has one Rot Blessing; it must draw a visible mark, not rely on its name alone (final I1).
test('the Rot Blessing layer draws a visible mark on the result map', async ({ page }) => {
  await page.goto('/seed/030') // tricephalos, rotted-woods
  const icon = page.locator('.marker-rot-blessing .marker-icon')
  await expect(icon).toBeVisible()
  await expect(icon).toHaveAttribute('src', /\/elements\/rot\.webp$/)
})

// Too many marks to name them all at a phone's default zoom: a tap on any named mark calls out its name, and
// another tap on it, or a pan of the map, puts it away.
test('a tap on a crest calls out its name, and a second tap or a pan hides it', async ({ page }) => {
  await page.goto('/seed/1003')
  const callout = page.locator('.marker-callout .map-name')
  const crest = page.locator('.marker-boss').filter({ hasText: 'Black Blade Kindred' }).locator('.marker-icon')
  await page.waitForTimeout(600)
  const tap = async () => {
    const r = (await crest.boundingBox())!
    await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2)
  }
  await tap()
  await expect(callout).toHaveText('Black Blade Kindred')
  await expect(callout).toHaveCSS('opacity', '1')
  await tap()
  await expect(callout).toHaveCount(0)
  await tap()
  await expect(callout).toBeVisible()
  const map = (await page.locator('.map-frame').boundingBox())!
  await page.mouse.move(map.width / 2, map.height / 3)
  await page.mouse.down()
  await page.mouse.move(map.width / 2 + 50, map.height / 3 + 40, { steps: 6 })
  await page.mouse.up()
  await expect(callout).toHaveCount(0)
})

// The castle is the map's centre: at default zoom it carries its guard's name and at least one of its crests' names.
test("the castle names its guard and at least one of its bosses at default zoom", async ({ page }) => {
  await page.goto('/seed/1003')
  await expect(page.locator('.marker-castle.marker-plain .map-name')).toHaveCSS('opacity', '1')
  const crestNames = page.locator('.marker-castle:not(.marker-plain) .map-name')
  await expect.poll(() => crestNames.evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === '1').length)).toBeGreaterThanOrEqual(1)
})

// A night's name may shrink to its number alone inside its ring on a phone: a tap on the ring still names it in full.
test("a tap on a night's ring calls out its full name", async ({ page }) => {
  await page.goto('/seed/1003')
  const ring = (await page.locator('.ring-mark .ring-2').boundingBox())!
  await page.waitForTimeout(600)
  await page.mouse.click(ring.x + ring.width / 2, ring.y + ring.height / 2)
  await expect(page.locator('.marker-callout .map-name')).toHaveText('Night 2: Tree Sentinel')
})

test("a callout on a mark whose name shows hides that name while it is open, and its plate is opaque", async ({ page }) => {
  await page.goto('/seed/1003')
  const mark = page.locator('.marker-boss').filter({ hasText: "Night's Cavalry" })
  const own = mark.locator('.map-name')
  await expect(own).toHaveCSS('opacity', '1')
  const r = (await mark.locator('.marker-icon').boundingBox())!
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2)
  const callout = page.locator('.marker-callout .map-name')
  await expect(callout).toHaveText("Night's Cavalry")
  await expect(own).toHaveCSS('opacity', '0')
  await expect(callout).toHaveCSS('background-color', 'rgb(14, 22, 40)')
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2)
  await expect(own).toHaveCSS('opacity', '1')
})

// Focus mode before the spawn is set: only the candidates stay gold, the spawn options dim with the map,
// and a tap on one cancels focus without recording a spawn (iter-8 M1; spec: "tap one to confirm or elsewhere to cancel").
test('in focus mode a tap on a dimmed spawn option cancels and records nothing', async ({ page }) => {
  const target = targets[0]
  await page.goto(`/find/${target.nightlord}/${target.earth}`)
  await expect(page.locator('.pin-spawn-option').first()).toBeAttached()
  const spawnSlots = await page.locator('.pin-spawn-option').evaluateAll((els) => els.map((el) => el.getAttribute('data-slot')!))
  expect(spawnSlots.length).toBeGreaterThan(0)
  // Enter focus mode on the first structure, expanding its kind first when it comes in elements.
  const kind = page.locator('[data-kind]').first()
  if (await kind.getAttribute('aria-expanded')) {
    // "Fort, 2 types: …" expands; its first chip is "Find Fort…".
    const kindName = (await kind.getAttribute('aria-label'))!.split(',')[0]
    await kind.click()
    await page.getByRole('button', { name: new RegExp(`^Find ${escapeRe(kindName)}`) }).first().click()
  } else {
    await kind.click()
  }
  await expect(page.locator('.pin-candidate').first()).toBeAttached()
  await expect(page.locator('.pin-spawn-option')).toHaveCount(0)
  await page.waitForTimeout(600) // let the pins settle
  const frame = (await page.locator('.map-frame').boundingBox())!
  const candidates = await page.locator('.pin-candidate').evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }))
  for (const slot of spawnSlots) {
    const pin = page.locator(`.pin-dimmed[data-slot="${slot}"]`)
    if (!(await pin.count())) continue // this spawn option is a candidate
    const box = (await pin.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    // On the open map, and out of any candidate's reach, so the tap is plainly on the spawn option.
    if (x < 30 || y < 90 || x > frame.width - 30 || y > frame.height - 110) continue
    if (candidates.some((c) => Math.hypot(c.x - x, c.y - y) < 60)) continue
    await page.mouse.click(x, y + 4)
    await expect(page.locator('.pin-candidate')).toHaveCount(0)
    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0)
    expect(new URL(page.url()).searchParams.get('s')).toBeNull()
    // Leaving focus brings the spawn options back, gold.
    await expect(page.locator('.pin-spawn-option')).toHaveCount(spawnSlots.length)
    return
  }
  throw new Error('no dimmed spawn option on screen clear of the candidates')
})

// Desktop: picking the spawn keeps keyboard focus on the new spawn pin, never the document body, and Tab
// reaches the pill and the side panel before the dozens of map pins (iter-8 m1).
for (const how of ['keyboard', 'pointer'] as const) {
  test(`desktop: a spawn picked by ${how} keeps focus on the spawn pin`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'the side panel is desktop only')
    await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
    const option = page.locator('.pin-spawn-option .pin-hit').first()
    const slot = (await option.getAttribute('data-slot'))!
    if (how === 'keyboard') {
      await option.focus()
      await page.keyboard.press('Enter')
    } else {
      await option.click()
    }
    await expect(page).toHaveURL(new RegExp(`s=spawn(%40|@)${slot}$`))
    await expect(page.locator(`.pin-hit[data-slot="${slot}"]`)).toBeFocused()
    await expect(page.locator(`.pin-hit[data-slot="${slot}"]`)).toHaveAccessibleName('Your spawn point')
  })
}

test('desktop: Tab reaches the controls and the side panel before the map pins', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the side panel is desktop only')
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  await expect(page.locator('.pin-hit').first()).toBeAttached()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Back' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('.side-panel button').first()).toBeFocused()
})

// Content scrolled under the full sheet's header meets a hairline there, as on iOS, not a hard cut (iter-8 m2).
test('the full result sheet shows a hairline under its header once content scrolls under it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the sheet is phone only')
  await page.goto(`/seed/${targets[0].id}`)
  const handle = page.getByRole('button', { name: /^Resize Seed details/ })
  await handle.focus()
  await handle.press('ArrowUp')
  await handle.press('ArrowUp')
  await expect(handle).toHaveAccessibleName('Resize Seed details, fully open')
  await page.waitForTimeout(900)
  const hairline = () => page.locator('.sheet-grab').evaluate((el) => {
    const after = getComputedStyle(el, '::after')
    return { opacity: parseFloat(after.opacity), color: after.backgroundColor, height: after.height }
  })
  expect((await hairline()).opacity).toBe(0)
  await page.locator('.sheet-body').evaluate((el) => { el.scrollTop = 40 })
  await expect.poll(async () => (await hairline()).opacity).toBe(1)
  // The theme's bronze rule (--rule), one pixel.
  expect(await hairline()).toMatchObject({ color: 'rgba(201, 165, 92, 0.22)', height: '1px' })
  await page.locator('.sheet-body').evaluate((el) => { el.scrollTop = 0 })
  await expect.poll(async () => (await hairline()).opacity).toBe(0)
})

// Desktop: expanding a kind leaves every tile where it was and shows the kind's variants in their own
// full-width row beneath the grid, rather than wrapping them in among the tiles (iter-8 m3).
test('desktop: an expanded kind shows its variants in a row beneath the tiles, which stay put', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the side panel is desktop only')
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  const grid = page.locator('.structure-grid')
  const tiles = () => grid.locator('[data-kind]').evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect()
    return [el.getAttribute('data-kind'), Math.round(r.x), Math.round(r.y)]
  }))
  const kind = grid.locator('[data-kind][aria-expanded]').first()
  await expect(kind).toBeVisible()
  const before = await tiles()
  await kind.click()
  await page.waitForTimeout(800) // let the layout animation settle
  expect(await tiles()).toEqual(before)
  const lastTileBottom = await grid.locator('[data-kind]').evaluateAll((els) => Math.max(...els.map((el) => el.getBoundingClientRect().bottom)))
  const variants = grid.locator('.structure-variants .strip-variant')
  expect(await variants.count()).toBeGreaterThan(1)
  for (const v of await variants.all()) expect((await v.boundingBox())!.y).toBeGreaterThanOrEqual(lastTileBottom)
})

// Reset sits beside Undo, so a mis-tap must be recoverable: Undo brings back every sighting it cleared (final I2).
test('Undo after Reset restores every sighting', async ({ page }) => {
  const target = targets[0]
  const sightings = `spawn@${target.spawn},24@church`
  await page.goto(`/find/${target.nightlord}/${target.earth}?s=${sightings}`)
  const live = page.locator('[aria-live]')
  const count = (await live.textContent())!
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBeNull()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBe(sightings)
  await expect(live).toHaveText(count)
})

// A touch tap leaves :hover stuck on the chip; it must still show one capsule, not a second one around it (final m4).
test('a tapped layer chip shows one capsule', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'sticky hover is a touch problem')
  await page.goto(`/seed/${targets[0].id}`)
  const chip = page.getByRole('button', { name: 'Bosses', exact: true })
  // Every layer starts on, as on the game's map: the tap turns Bosses off, and hover sticks all the same.
  await chip.tap()
  await expect(chip).toHaveAttribute('aria-pressed', 'false')
  await expect(chip).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})

// A phone chip's short name keeps clear of its tile's rim, so two neighbouring names never run together.
test("a phone layer chip's name keeps 4px from its tile's edges", async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop chips are plain names')
  await page.goto(`/seed/${targets[0].id}`)
  await expect(page.locator('.chip-tile').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const margins = await page.locator('.chip-tile').evaluateAll((tiles) => tiles.map((b) => {
    const range = document.createRange()
    range.selectNodeContents(b.querySelector('span[aria-hidden]')!)
    const text = range.getBoundingClientRect()
    const tile = b.getBoundingClientRect()
    return Math.min(text.left - tile.left, tile.right - text.right)
  }))
  expect(margins.length).toBeGreaterThanOrEqual(6)
  for (const m of margins) expect(m).toBeGreaterThanOrEqual(4)
})

// Desktop: the finder's back, undo and reset sit in the map's top-left corner, not floating over its middle.
test("the desktop finder's controls sit in the map's top-left corner", async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone pill spans the screen')
  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}`)
  const pill = await page.locator('.pill').evaluate((el) => el.getBoundingClientRect().toJSON())
  expect(pill.left).toBeLessThanOrEqual(16)
  expect(pill.top).toBeLessThanOrEqual(16)
})

// A share sheet that fails for any reason but the user closing it still gets the link out, by copying (final m5).
test('a failed share falls back to copying the link', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the native share sheet is phone only')
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { (window as any).copied = text } } })
  })
  await page.goto(`/seed/${targets[0].id}`)
  await page.getByRole('button', { name: 'Share' }).click()
  await expect(page.getByRole('status')).toHaveText('Link copied')
  expect(await page.evaluate(() => (window as any).copied)).toMatch(new RegExp(`/seed/${targets[0].id}$`))
})

// In-app Back steps back through history instead of pushing, so the browser's Back and Forward agree with it
// afterwards and never re-enter the screen just left (final m2).
test('in-app Back from a result steps back through history', async ({ page }) => {
  const target = targets[0]
  // The fewest sightings that single out the seed, in order: the finder solves it on load.
  const pool = data.seeds.filter((s: any) => s.nightlord === target.nightlord && s.earth === target.earth)
  let left = pool.filter((s: any) => s.spawn === target.spawn)
  const sightings = [`spawn@${target.spawn}`]
  for (const [slot, key] of Object.entries<string | null>(target.slots)) {
    if (left.length === 1) break
    const next = left.filter((s: any) => s.slots[slot] === key)
    if (next.length === left.length) continue
    left = next
    sightings.push(`${slot}@${key ?? 'none'}`)
  }
  const rest = sightings.slice(0, -1).join(',')
  const finder = new RegExp(`/find/${target.nightlord}/${target.earth}\\?s=`)

  await page.goto('/')
  await page.getByRole('button', { name: new RegExp(`^${nightlordName(target.nightlord)}`) }).click()
  await page.getByRole('button', { name: new RegExp(`^${earthName(target.earth)}`) }).click()
  await expect(page).toHaveURL(new RegExp(`/find/${target.nightlord}/${target.earth}$`))
  // Stand in for tapping the sightings: set them on this entry and let the finder replay them.
  await page.evaluate((s) => { history.replaceState(history.state, '', `?s=${s}`) }, sightings.join(','))
  await page.reload()
  await expect(page).toHaveURL(new RegExp(`/seed/${target.id}`))
  const length = await page.evaluate(() => history.length)

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(finder)
  expect(new URL(page.url()).searchParams.get('s')).toBe(rest)
  expect(await page.evaluate(() => history.length)).toBe(length)

  await page.goForward()
  await expect(page.getByRole('heading', { name: `Seed ${target.id}` })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(finder)

  // The finder's own Back lands on the home it came from, the same entry browser Back would.
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate(() => history.length)).toBe(length)
  await page.goForward()
  await expect(page).toHaveURL(finder)
})

// 65 seeds have a Church at the spawn point: the result shows both, and the spawn pin's sheet can record it (final m1).
test.describe('a Church at the spawn point', () => {
  const churchSeed = data.seeds.find((s: any) => s.slots[s.spawn] === 'church')

  test('shows on the result map with the spawn puck on it', async ({ page }) => {
    await page.goto(`/seed/${churchSeed.id}`)
    const spawn = page.locator(`.pin[data-slot="${churchSeed.spawn}"]`)
    await expect(spawn).toHaveAccessibleName('Spawn point, Church')
    await expect(spawn.locator('.structure-art')).toBeVisible()
    await expect(spawn.locator('.spawn-badge')).toBeVisible()
    // Either layer alone still shows its part.
    await page.getByRole('button', { name: 'Spawn', exact: true }).click()
    await expect(spawn).toHaveAccessibleName('Church')
    await page.getByRole('button', { name: 'Spawn', exact: true }).click()
    await page.getByRole('button', { name: 'Structures', exact: true }).click()
    await expect(spawn).toHaveAccessibleName('Spawn point')
  })

  test('can be recorded from the spawn pin', async ({ page }) => {
    await page.goto(`/find/${churchSeed.nightlord}/${churchSeed.earth}?s=spawn@${churchSeed.spawn}`)
    await page.getByRole('button', { name: 'Your spawn point', exact: true }).click()
    await page.locator(`.options[data-slot="${churchSeed.spawn}"]`).getByRole('button', { name: /^Church, leaves \d+$/ }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).toMatch(new RegExp(`(^|,)${churchSeed.spawn}@church(,|$)`))
  })
})

// Offline after the first visit: the service worker serves the app, the map and the structure art (final m8).
test('works offline once the service worker has installed', async ({ page, context, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || isMobile, 'one engine is enough to prove the precache')
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null)
  await context.setOffline(true)
  const loaded = (selector: string) =>
    expect.poll(() => page.locator(selector).evaluateAll((imgs) => imgs.length > 0 && imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0)))
      .toBe(true)

  await page.goto(`/seed/${targets[0].id}`)
  await expect(page.getByRole('heading', { name: `Seed ${targets[0].id}` })).toBeVisible()
  await loaded('img.map-image')
  await loaded('.pin img.structure-art')

  await page.goto(`/find/${targets[0].nightlord}/${targets[0].earth}?s=spawn@${targets[0].spawn}`)
  await loaded('img.map-image')
  await loaded('.structure-grid img.structure-art')
})

// The Nightlord in the bottom-left corner, as in the game: its medallion is named with what its card shows, and on
// phone it rides above the collapsed sheet (never under it) and tucks away once the sheet opens, coming back at peek.
test.describe('the Nightlord medallion', () => {
  const seed = targets[0]
  const phrase = `${nightlordName(seed.nightlord)}: ${weaknessPhrase(data.weaknesses.nightlords[seed.nightlord])}`
  const box = (page: import('@playwright/test').Page, s: string) => page.locator(s).evaluate((el) => el.getBoundingClientRect().toJSON())

  test('shows its weaknesses on the result, above the sheet', async ({ page, isMobile }) => {
    await page.goto(`/seed/${seed.id}`)
    // Desktop keeps the card open, so the medallion is a named image there; on phone it toggles the card.
    const medal = page.getByRole(isMobile ? 'button' : 'img', { name: phrase, exact: true })
    await expect(medal).toBeVisible()
    expect((await box(page, '.nl-medal')).width).toBeGreaterThanOrEqual(isMobile ? 44 : 100)
    if (!isMobile) return expect(page.locator('.nl-card')).toBeVisible()
    // On phone the card starts folded, so the medallion alone sits in the corner.
    await expect(page.locator('.nl-card')).toHaveCount(0)
    const handle = page.getByRole('button', { name: /^Resize Seed details/ })
    await page.waitForTimeout(900)
    expect((await box(page, '.nl-medal')).bottom).toBeLessThanOrEqual((await box(page, '.sheet')).top)
    await handle.focus()
    await handle.press('ArrowUp')
    await expect(handle).toHaveAccessibleName('Resize Seed details, half open')
    // Open, the sheet leaves the map above it to the map: a night's ring there stays in sight.
    await expect(medal).toBeHidden()
    await handle.press('ArrowDown')
    await expect(handle).toHaveAccessibleName('Resize Seed details, collapsed')
    await expect(medal).toBeVisible()
    await page.waitForTimeout(1200)
    expect((await box(page, '.nl-medal')).bottom).toBeLessThanOrEqual((await box(page, '.sheet')).top)
  })

  // The map frames itself above the medallion; the medallion tucking as the sheet opens must not move the map.
  test('the map holds still while the medallion tucks away', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'the sheet is phone only')
    await page.goto(`/seed/${seed.id}`)
    await page.waitForTimeout(1200)
    const where = () => page.locator('.map-layer').evaluate((el) => getComputedStyle(el).transform)
    const before = await where()
    const handle = page.getByRole('button', { name: /^Resize Seed details/ })
    await handle.focus()
    await handle.press('ArrowUp')
    await expect(page.locator('.nl-medal')).toBeHidden()
    await page.waitForTimeout(1200)
    expect(await where()).toBe(before)
  })

  test('on phone, a tap on the medallion opens its card, and another tap or a pan of the map folds it', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'desktop keeps the card open on the result')
    await page.goto(`/seed/${seed.id}`)
    const medal = page.getByRole('button', { name: phrase, exact: true })
    await expect(medal).toHaveAttribute('aria-expanded', 'false')
    await medal.click()
    await expect(page.locator('.nl-card')).toBeVisible()
    await expect(medal).toHaveAttribute('aria-expanded', 'true')
    await medal.click()
    await expect(page.locator('.nl-card')).toHaveCount(0)
    await medal.click()
    await expect(page.locator('.nl-card')).toBeVisible()
    // A pan of the map folds it too.
    const map = await box(page, '.map-frame')
    await page.mouse.move(map.width / 2, map.height / 3)
    await page.mouse.down()
    await page.mouse.move(map.width / 2 + 50, map.height / 3 + 40, { steps: 6 })
    await page.mouse.up()
    await expect(page.locator('.nl-card')).toHaveCount(0)
    await expect(medal).toHaveAttribute('aria-expanded', 'false')
  })

  // The first view of a result shows the whole island: no mark is off the screen, under the pill or the sheet, or
  // under the medallion, on a Limveld seed and on a Great Hollow one.
  for (const id of [seed.id, data.seeds.find((s: any) => s.earth === 'great-hollow').id]) {
    test(`at rest, every mark of seed ${id} is in sight and clear of the chrome`, async ({ page }) => {
      await page.goto(`/seed/${id}`)
      await page.waitForTimeout(1200)
      const bad = await page.evaluate(() => {
        const marks = [...document.querySelectorAll<HTMLElement>('.pin .pin-mark, .marker .mark > img, .ring-mark .ring')]
        const pill = document.querySelector('.pill')!.getBoundingClientRect()
        const frame = document.querySelector('.map-frame')!.getBoundingClientRect()
        const bottom = document.querySelector('.sheet')?.getBoundingClientRect().top ?? frame.bottom
        const corner = [...document.querySelectorAll('[data-corner]')].map((e) => e.getBoundingClientRect())
        return marks.flatMap((m) => {
          const r = m.getBoundingClientRect()
          const cx = (r.left + r.right) / 2
          const cy = (r.top + r.bottom) / 2
          const off = cx < frame.left || cx > frame.right || cy < pill.bottom || cy > bottom
          const under = corner.some((b) => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top)
          return off || under ? [`${m.className} at ${Math.round(cx)},${Math.round(cy)}`] : []
        })
      })
      expect(bad).toEqual([])
    })
  }

  test('shows in the finder, its card folded until asked for, and clear of the strip', async ({ page, isMobile }) => {
    await page.goto(`/find/${seed.nightlord}/${seed.earth}`)
    const medal = page.getByRole('button', { name: phrase, exact: true })
    await expect(medal).toBeVisible()
    await expect(page.locator('.nl-card')).toHaveCount(0)
    if (isMobile) expect((await box(page, '.nl-medal')).bottom).toBeLessThanOrEqual((await box(page, '.strip')).top)
    await medal.click()
    await expect(page.locator('.nl-card')).toBeVisible()
  })

  // "Status" alone could read as what the Nightlord inflicts: the row says weak status, and names each one in words.
  test('its card names the statuses it is weak to, on the map and on Home', async ({ page, isMobile }) => {
    const statuses: DamageKey[] = data.weaknesses.nightlords[seed.nightlord].status
    expect(statuses.length).toBeGreaterThan(0)
    await page.goto(`/seed/${seed.id}`)
    if (isMobile) await page.locator('.nl-medal').click()
    const row = page.locator('.nl-card .nl-row').filter({ hasText: 'Weak status' })
    for (const k of statuses) await expect(row).toContainText(DAMAGE_NAMES[k])
    await page.goto('/')
    await page.getByRole('button', { name: nightlordName(seed.nightlord) }).click()
    const pick = page.getByRole('img', { name: phrase, exact: true })
    await expect(pick).toBeVisible()
    await expect(pick.locator('.nl-medal')).toBeVisible()
    // On phone the panel rises over the grid's picked medallion and its name, so it names the pick itself.
    if (isMobile) await expect(pick.locator('.nl-pick-name')).toHaveText(nightlordName(seed.nightlord))
    for (const k of statuses) await expect(pick.locator('.nl-row').filter({ hasText: 'Weak status' })).toContainText(DAMAGE_NAMES[k])
  })

  // The card's accessible name says what its rows show: a status Balancers is listed weak to is spoken as its weak status.
  test("Balancers' card speaks Sleep as its weak status, as its rows show it", async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Balancers' }).click()
    const pick = page.getByRole('img', { name: 'Balancers: weak to Strike; resists Holy; weak status Sleep', exact: true })
    await expect(pick).toBeVisible()
    await expect(pick.locator('.nl-row').filter({ hasText: 'Weak status' })).toContainText('Sleep')
  })

  test('no name on the map runs under it or its card', async ({ page, isMobile }) => {
    await page.goto(`/seed/${seed.id}`)
    if (isMobile) await page.locator('.nl-medal').click()
    await expect(page.locator('.nl-card')).toBeVisible()
    await page.waitForTimeout(900)
    const crossing = await page.evaluate(() => {
      const corner = [...document.querySelectorAll('[data-corner]')].map((e) => e.getBoundingClientRect())
      return [...document.querySelectorAll<HTMLElement>('.map-name')]
        .filter((n) => getComputedStyle(n).opacity === '1')
        .filter((n) => {
          const a = n.getBoundingClientRect()
          return corner.some((b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
        })
        .map((n) => n.textContent)
    })
    expect(crossing).toEqual([])
  })
})

// Each night's boss row says what the weakness data knows, and is never blank (a blank reads as missing data):
// what the boss is weak to, else what it resists, else that it has no damage weakness, or that there is no data.
const expectedLine = (boss: string) => {
  const w: { weak: DamageKey[]; resist: DamageKey[] } | undefined = data.weaknesses.bosses[boss]
  const names = (keys: DamageKey[]) => keys.map((k) => DAMAGE_NAMES[k]).join(', ')
  if (!w) return 'No data'
  if (w.weak.length) return `weak to ${names(w.weak)}`
  if (w.resist.length) return `resists ${names(w.resist)}`
  return 'No damage weakness'
}
// Seed 000 has a boss with a weakness (night 1) and one with only resistances (night 2); a seed with Artorias
// has one the data does not cover.
const artorias = data.seeds.find((s: any) => s.nights[1].boss === 'Artorias' || s.nights[2].boss === 'Artorias')
for (const seed of [targets[0], artorias]) {
  test(`the run card says what each night boss of seed ${seed.id} is weak to`, async ({ page }) => {
    await page.goto(`/seed/${seed.id}`)
    for (const n of [1, 2] as const) {
      const row = page.locator('.run-row', { has: page.locator('dt', { hasText: `Night ${n}` }) })
      await expect(row.locator('.weak-line')).toContainText(expectedLine(seed.nights[n].boss))
    }
  })
}
