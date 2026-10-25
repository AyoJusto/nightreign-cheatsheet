import { test as base } from '@playwright/test'

export { expect, type Page } from '@playwright/test'

export const test = base.extend<{ withoutViewTransitionsOnWindowsWebKit: void }>({
  withoutViewTransitionsOnWindowsWebKit: [async ({ page, browserName }, use) => {
    if (browserName === 'webkit' && process.platform === 'win32') {
      await page.addInitScript(() => Object.defineProperty(document, 'startViewTransition', { value: undefined }))
    }
    await use()
  }, { auto: true }],
})
