import { test, expect } from '@playwright/test'

test('opens About from home and returns', async ({ page }, testInfo) => {
  const capture = async (name: string) => {
    await testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' })
  }

  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Choose your Nightlord' })).toBeVisible()
  await capture('Home')

  await page.getByRole('button', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
  await expect(page.getByText('Bonfire Buddy helps you work out your Nightreign seed mid-run and see its full layout.')).toBeVisible()
  await capture('About')

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Choose your Nightlord' })).toBeVisible()
  await capture('Home after Back')
})
