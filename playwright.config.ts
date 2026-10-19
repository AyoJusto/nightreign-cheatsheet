import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // false, not the reuse-locally idiom: a leftover preview from another run would make this suite pass on
  // stale code (final review m6).
  webServer: { command: 'npm run build && npm run preview', port: 4173, reuseExistingServer: false, timeout: 180_000 },
  use: { baseURL: 'http://localhost:4173/nightreign-cheatsheet/' },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 15'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
})
