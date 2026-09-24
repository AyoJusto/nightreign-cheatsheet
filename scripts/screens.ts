// Captures the states the Readiness Loop reviews. Usage: npm run screens -- <iteration>
import { chromium, webkit, devices, type Page } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const iter = process.argv[2] ?? '0'
const out = `docs/specs/screens/iter-${iter}`
mkdirSync(out, { recursive: true })
const base = 'http://localhost:4173'
const seed = JSON.parse(readFileSync('src/data/seeds.json', 'utf8')).seeds.find((s: any) => s.nightlord === 'tricephalos' && s.earth === 'default')

type Shot = (page: Page) => Promise<void>

// The Sheet component (src/ui/Sheet.tsx) has no programmatic detent control — it only
// snaps to peek/half/full from a drag gesture's release velocity and position. So to
// capture the half and full result sheets, drag the grab handle the way a thumb would:
// press it, move by the same pixel delta the sheet's own height math uses, pause so
// release velocity is ~0, then let it settle on the nearest detent.
async function dragSheetTo(page: Page, detent: 'half' | 'full') {
  const grab = page.locator('.sheet-grab')
  const box = await grab.boundingBox()
  if (!box) throw new Error('sheet grab handle not found')
  const vh = page.viewportSize()!.height
  const targetHeight = Math.round(vh * (detent === 'half' ? 0.5 : 0.92))
  const x = box.x + box.width / 2
  const startY = box.y + box.height / 2
  const targetY = vh - targetHeight
  await page.mouse.move(x, startY)
  await page.mouse.down()
  const steps = 20
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x, startY + (targetY - startY) * (i / steps))
    await page.waitForTimeout(16)
  }
  // Pause with no movement so drag velocity decays to ~0 before release — otherwise the
  // sheet's own fling-detection (velocity-weighted projection) overrides the drop position
  // and both detents snap to whichever one the fling favors.
  await page.waitForTimeout(200)
  await page.mouse.up()
  await page.waitForTimeout(700)
}

const shots: [string, Shot][] = [
  ['home', async (p) => { await p.goto(base) }],
  ['home-picked', async (p) => { await p.goto(base); await p.getByRole('button', { name: /^Tricephalos/ }).click() }],
  ['finder-start', async (p) => { await p.goto(`${base}/find/tricephalos/default`) }],
  ['finder-sheet-many-options', async (p) => {
    // Before any sighting the candidate pool is unfiltered, so an open slot's sheet
    // (not a spawn-option pin, which applies immediately) lists many more options.
    await p.goto(`${base}/find/tricephalos/default`)
    await p.getByRole('button', { name: /^Slot \d+$/ }).first().click()
  }],
  ['finder-after-spawn', async (p) => { await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`) }],
  ['finder-sheet', async (p) => {
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`)
    await p.getByRole('button', { name: /^Slot \d+$/ }).first().click()
  }],
  ['finder-focus', async (p) => {
    // Structure buttons live in the bottom strip on phone and the side panel on desktop,
    // but both keep the "Find <structure>" accessible name.
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`)
    await p.getByRole('button', { name: /^Find / }).first().click()
  }],
  ['result-peek', async (p) => { await p.goto(`${base}/seed/${seed.id}`) }],
  ['about', async (p) => { await p.goto(`${base}/about`) }],
  ['great-hollow', async (p) => { await p.goto(`${base}/find/dreglord/great-hollow`) }],
]

// Phone only: the result sheet's other detents need a drag to reach, and there is no
// side panel to fall back on. A reduced-motion capture of result-peek is skipped — with
// motion swapped for a fade, a still screenshot looks identical to the normal capture.
const phoneOnlyShots: [string, Shot][] = [
  ['result-half', async (p) => { await p.goto(`${base}/seed/${seed.id}`); await dragSheetTo(p, 'half') }],
  ['result-full', async (p) => { await p.goto(`${base}/seed/${seed.id}`); await dragSheetTo(p, 'full') }],
]

for (const [name, engine, context] of [
  ['phone', webkit, devices['iPhone 15']],
  ['desktop', chromium, { viewport: { width: 1440, height: 900 } }],
] as const) {
  const browser = await engine.launch()
  const page = await (await browser.newContext(context)).newPage()
  const list = name === 'phone' ? [...shots, ...phoneOnlyShots] : shots
  for (const [shot, go] of list) {
    await go(page)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/${name}-${shot}.png` })
  }
  await browser.close()
}
console.log('screens in', out)
