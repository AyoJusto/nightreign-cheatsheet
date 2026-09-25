/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    // seeds.json is data, not app code: its own chunk keeps the main bundle under the 200 KB gzip budget.
    // Raw size is large (it's JSON) but gzips small, so the default 500 KB warning doesn't apply here.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'seeds-data', test: /src[\\/]data[\\/]seeds\.json/ }],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,webp,png,json,woff2}'], maximumFileSizeToCacheInBytes: 4_000_000 },
      manifest: {
        name: 'Bonfire Buddy',
        short_name: 'Bonfire Buddy',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
})
