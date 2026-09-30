import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    // Installable + offline. On the home screen the sheet is exempt from
    // Safari's 7-day storage wipe and opens without browser chrome.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons.svg'],
      manifest: {
        name: 'DraDoLog - Deník dobrodruha',
        short_name: 'DraDoLog',
        description: 'Deník postavy pro Dračí doupě 1.6',
        lang: 'cs',
        start_url: '/',
        display: 'standalone',
        background_color: '#0e1a18',
        theme_color: '#0e1a18',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [{ name: 'Pán jeskyně', url: '/pj.html', icons: [{ src: 'icon-192.png', sizes: '192x192' }] }],
      },
      workbox: {
        // Both pages and everything they need, fonts included.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: null,
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Two pages: the player's sheet (/) and the PJ's party view (/pj.html).
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        pj: fileURLToPath(new URL('./pj.html', import.meta.url)),
      },
    },
  },
})
