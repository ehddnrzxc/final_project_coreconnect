import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 기존 REST API
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket/SockJS 프록시 지정
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,        // <=== WebSocket용 프록시
        secure: false,
      },
      // 채팅 REST/SockJS 둘다 커버할 경우 추가(선택)
      '/chat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,       // <=== WebSocket용 프록시
        secure: false,
      },
    },
  },
})