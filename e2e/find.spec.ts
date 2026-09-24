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
