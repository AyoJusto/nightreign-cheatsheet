import { chromium, webkit, devices, type Page } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const iter = process.argv[2] ?? '0'
const out = `docs/specs/screens/iter-${iter}`
mkdirSync(out, { recursive: true })
const base = 'http://localhost:4173/nightreign-cheatsheet/#'
const seed = JSON.parse(readFileSync('src/data/seeds.json', 'utf8')).seeds.find((s: any) => s.nightlord === 'tricephalos' && s.earth === 'default')

const spawnChurch = JSON.parse(readFileSync('src/data/seeds.json', 'utf8')).seeds.find((s: any) => s.slots[s.spawn] === 'church')

type Shot = (page: Page) => Promise<void>

// A keypress lands exactly on a detent; a scripted drag would have to guess its height.
async function stepSheetTo(page: Page, detent: 'half' | 'full') {
  const handle = page.getByRole('button', { name: /^Resize / })
  await handle.focus()
  for (let i = 0; i < (detent === 'half' ? 1 : 2); i++) await handle.press('ArrowUp')
  await handle.blur()
  await page.waitForTimeout(700)
}

const shots: [string, Shot][] = [
  ['home', async (p) => { await p.goto(base) }],
  ['home-picked', async (p) => { await p.goto(`${base}/find/tricephalos`) }],
  ['finder-start', async (p) => { await p.goto(`${base}/find/tricephalos/default`) }],
  ['finder-sheet-many-options', async (p) => {
    await p.goto(`${base}/find/tricephalos/default`)
    await p.getByRole('button', { name: 'Unknown site', exact: true }).first().click()
  }],
  ['finder-after-spawn', async (p) => { await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`) }],
  ['finder-sheet', async (p) => {
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`)
    await p.getByRole('button', { name: 'Unknown site', exact: true }).first().click()
  }],
  ['finder-focus', async (p) => {
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn}`)
    await p.getByRole('button', { name: /^Find / }).first().click()
  }],
  ['finder-certain-slot', async (p) => {
    // On this seed, slot 24 as a church leaves two candidates that agree on several other slots.
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn},24@church`)
  }],
  ['finder-sighted-sheet', async (p) => {
    await p.goto(`${base}/find/tricephalos/default?s=spawn@${seed.spawn},24@church`)
    await p.getByRole('button', { name: 'Church, sighted', exact: true }).click()
  }],
  ['result-peek', async (p) => { await p.goto(`${base}/seed/${seed.id}`) }],
  ['result-layers', async (p) => { await p.goto(`${base}/seed/000`) }],
  ['result-spawn-church', async (p) => { await p.goto(`${base}/seed/${spawnChurch.id}`) }],
  ['finder-spawn-church-sheet', async (p) => {
    await p.goto(`${base}/find/${spawnChurch.nightlord}/${spawnChurch.earth}?s=spawn@${spawnChurch.spawn}`)
    await p.getByRole('button', { name: 'Your spawn point', exact: true }).click()
  }],
  ['finder-spawn-church', async (p) => { await p.goto(`${base}/find/${spawnChurch.nightlord}/${spawnChurch.earth}?s=spawn@${spawnChurch.spawn},${spawnChurch.spawn}@church`) }],
  ['about', async (p) => { await p.goto(`${base}/about`) }],
  ['great-hollow', async (p) => { await p.goto(`${base}/find/dreglord/great-hollow`) }],
]

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
