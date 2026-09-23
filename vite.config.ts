/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,webp,otf,json}'], maximumFileSizeToCacheInBytes: 4_000_000 },
      manifest: {
        name: 'Bonfire Buddy',
        short_name: 'Bonfire Buddy',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [],
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
})
