import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpeg'],
      manifest: {
        name: 'Cloud Kalisanen',
        short_name: 'CloudKalisanen',
        description: 'Cloud Kalisanen storage gateway.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/all-files',
        scope: '/',
        orientation: 'portrait-primary',
        icons: [
          { src: '/logo.jpeg', sizes: '192x192', type: 'image/jpeg' },
          { src: '/logo.jpeg', sizes: '512x512', type: 'image/jpeg' },
          { src: '/logo.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/(auth|connected-accounts|files|folders|invites|provider-configs|public|storage|uploads)(\/|$)/],
        globPatterns: ['**/*.{js,css,html,svg,ico,png,webp,jpeg,jpg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
