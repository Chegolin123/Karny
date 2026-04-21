// C:\OSPanel\domains\karny\frontend\vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'localhost',
      '.lhr.life',
      '.serveo.net',
      '.serveousercontent.com',
      'parties-room.online'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/chat': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})