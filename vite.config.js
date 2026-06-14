import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Proxy tích hợp của Vite thay cho proxy.js — request từ trình duyệt đi qua
// dev server (cùng origin) nên KHÔNG dính CORS, server mới gọi sang Pango.
//
// QUAN TRỌNG: Pango trả 403 nếu thấy header origin/referer của trình duyệt,
// nên phải strip chúng trước khi forward (giống proxy.js cũ).
const stripBrowserHeaders = (proxy) => {
  proxy.on('proxyReq', (proxyReq) => {
    proxyReq.removeHeader('origin')
    proxyReq.removeHeader('referer')
  })
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Đổi refreshToken -> accessToken
      '/api-auth': {
        target: 'https://account.mydatalakes.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api-auth/, ''),
        configure: stripBrowserHeaders,
      },
      // Ingest dữ liệu
      '/api-ingest': {
        target: 'https://svc.mydatalakes.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api-ingest/, ''),
        configure: stripBrowserHeaders,
      },
    },
  },
})
