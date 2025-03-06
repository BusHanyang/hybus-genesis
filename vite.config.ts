/* eslint-disable camelcase */
import { partytownVite } from '@builder.io/partytown/utils'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-macros', 'babel-plugin-styled-components'],
      },
    }),
    svgr(),
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
        theme_color: '#FBFBFB',
        background_color: '#FBFBFB',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        name: '버스하냥',
        short_name: '버스하냥',
        shortcuts: [
          {
            name: '전체 시간표',
            short_name: '시간표',
            description: '전체 시간표 보기',
            url: '/all',
            icons: [{ src: 'image/icon_x192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: 'image/icon_x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'image/icon_x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'image/icon_x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'image/icon_x1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'image/maskable_x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'image/maskable_x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'image/maskable_x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'image/maskable_x1024.png',
            sizes: '1024x1024',
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
