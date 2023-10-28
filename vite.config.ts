/* eslint-disable camelcase */
import { partytownVite } from '@builder.io/partytown/utils'
import react from '@vitejs/plugin-react'
import path from 'path'
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
      // Service worker setting
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{html,js,css,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pretendard\/.*\.woff2$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pretendard-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // <== 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      // Deployment
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'robots.txt',
        'safari-pinned-tab.svg',
      ],

      // PWA setting
      manifest: {
        theme_color: '#ffffff',
        background_color: '#ffffff',
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
          {
            src: 'image/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    partytownVite({
      dest: path.join(__dirname, 'dist', '~partytown'),
    }),
  ],
  publicDir: './public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app/'),
    },
  },
})
