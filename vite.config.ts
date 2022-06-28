/* eslint-disable camelcase */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress' }),
    VitePWA({
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'robots.txt',
        'safari-pinned-tab.svg',
      ],
      manifest: {
        theme_color: '#0e4a84',
        background_color: '#898c8e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        name: 'HYBUS',
        short_name: 'HYBUS',
        icons: [
          {
            src: 'image/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'image/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  publicDir: './public',
})