import { test, expect } from './test'

test('the Night 1 boss narrows the seeds and is kept in the link', async ({ page, isMobile }) => {
  await page.goto('#/find/tricephalos/default')
  if (isMobile) await page.getByRole('button', { name: 'Night 1 boss' }).click()
  else await page.getByRole('button', { name: 'Choose the boss' }).click()
  const option = page.locator('[data-night="1"]').getByRole('button', { name: /^Bell Bearing Hunter, leaves / })
  await option.click()
  await expect(page).toHaveURL(/night1(%40|@)bell-bearing-hunter/)
  if (isMobile) await expect(page.getByRole('button', { name: 'Night 1 boss, Bell Bearing Hunter' })).toBeVisible()
  else await expect(page.getByRole('button', { name: 'Bell Bearing Hunter' })).toBeVisible()
})
