import reactRefresh from '@vitejs/plugin-react-refresh'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), viteCompression({ algorithm: 'gzip' })],
})
