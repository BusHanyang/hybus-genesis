/* eslint-disable camelcase */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-macros', 'babel-plugin-styled-components'],
      },
    }),
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
        name: '버스하냥',
        short_name: '버스하냥',
        icons: [
          {
            src: 'image/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'image/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'image/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  publicDir: './public',
})
