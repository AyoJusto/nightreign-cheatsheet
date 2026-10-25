import { test, expect } from './test'

test('pages paint in Graphite', async ({ page }) => {
  await page.goto('#/nightlord/tricephalos')
  const ground = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  expect(ground).toBe('rgb(11, 11, 12)')
  const holy = page.getByRole('row', { name: /^Holy/ })
  await expect(holy.getByRole('cell')).toHaveCSS('color', 'rgb(242, 194, 110)')
  await expect(page.getByRole('row', { name: /^Madness/ }).getByRole('cell')).toHaveCSS('color', 'rgb(255, 122, 107)')
})

test('titles are set in the bundled serif, with no font CDN', async ({ page }) => {
  const fontHosts: string[] = []
  page.on('request', (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontHosts.push(r.url()) })
  await page.goto('#/bosses')
  await expect(page.getByRole('heading', { name: 'Bosses', level: 1 })).toHaveCSS('font-family', /Cormorant Garamond/)
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].some((f) => f.family.includes('Cormorant Garamond') && f.status === 'loaded'))
  expect(loaded).toBe(true)
  expect(fontHosts).toEqual([])
})
