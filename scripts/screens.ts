// Captures the states the Readiness Loop reviews. Usage: npm run screens -- <iteration>
import { chromium, webkit, devices, type Page } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const iter = process.argv[2] ?? '0'
const out = `docs/specs/screens/iter-${iter}`
mkdirSync(out, { recursive: true })
const base = 'http://localhost:4173'
const seed = JSON.parse(readFileSync('src/data/seeds.json', 'utf8')).seeds.find((s: any) => s.nightlord === 'tricephalos' && s.earth === 'default')

type Shot = (page: Page) => Promise<void>

// Step the result sheet with its keyboard-operable grab handle: detent heights are measured
// from the page, so a keypress lands exactly on a detent where a scripted drag would guess.
async function stepSheetTo(page: Page, detent: 'half' | 'full') {
  const handle = page.getByRole('button', { name: /^Resize / })
  await handle.focus()
  for (let i = 0; i < (detent === 'half' ? 1 : 2); i++) await handle.press('ArrowUp')
  await handle.blur() // the capture shows the detent, not the focus ring
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
    await p.getByRole('button', { name: 'Unknown site', exact: true }).first().click()
  }],
  ['finder-after-spawn', async (p) => { await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`) }],
  ['finder-sheet', async (p) => {
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`)
    await p.getByRole('button', { name: 'Unknown site', exact: true }).first().click()
  }],
  ['finder-focus', async (p) => {
    // Structure buttons live in the bottom strip on phone and the side panel on desktop,
    // but both keep the "Find <structure>" accessible name.
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`)
    await p.getByRole('button', { name: /^Find / }).first().click()
  }],
  ['finder-certain-slot', async (p) => {
    // Slot 24 (church) on this seed leaves two candidates that agree on several other slots, so those
    // reveal as certain (ghosted) without narrowing to one seed and leaving the finder (m6).
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn},24@church`)
  }],
  ['result-peek', async (p) => { await p.goto(`${base}/seed/${seed.id}`) }],
  ['result-layers', async (p) => {
    // The busiest marker set a player turns on: labels must stay clear of each other and of every glyph.
    await p.goto(`${base}/seed/000`)
    for (const layer of ['Bosses', 'Chests']) await p.getByRole('button', { name: layer, exact: true }).click()
  }],
  ['about', async (p) => { await p.goto(`${base}/about`) }],
  ['great-hollow', async (p) => { await p.goto(`${base}/find/dreglord/great-hollow`) }],
]

// Phone only: the result sheet's other detents need a step to reach, and there is no
// side panel to fall back on. A reduced-motion capture of result-peek is skipped — with
// motion swapped for a fade, a still screenshot looks identical to the normal capture.
const phoneOnlyShots: [string, Shot][] = [
  ['result-half', async (p) => { await p.goto(`${base}/seed/${seed.id}`); await stepSheetTo(p, 'half') }],
  ['result-full', async (p) => { await p.goto(`${base}/seed/${seed.id}`); await stepSheetTo(p, 'full') }],
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
