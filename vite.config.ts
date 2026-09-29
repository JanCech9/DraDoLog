import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
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
