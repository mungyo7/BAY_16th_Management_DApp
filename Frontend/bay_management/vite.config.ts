import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({}),
    react(),
    tailwindcss(),
    viteTsconfigPaths({
      //
      root: resolve(__dirname),
    }),
  ],
  server: {
    host: true, // 외부 호스트 허용
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app', // ngrok 도메인 패턴 허용
      '.ngrok.io',       // 구버전 ngrok 도메인
    ],
  },
})
