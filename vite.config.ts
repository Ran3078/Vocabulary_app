import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 部署路徑：repo 名稱（若部署到 <user>.github.io 根目錄請改回 '/'）
const BASE = '/Vocabulary_app/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '單字卡 Vocabulary',
        short_name: '單字卡',
        description: '中英單字卡練習：圖片辨識匯入、翻牌、測驗、間隔重複',
        lang: 'zh-TW',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#4f46e5',
        background_color: '#f5f5fa',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // Gemini API 一律走網路，不快取
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  test: {
    environment: 'node'
  }
})
