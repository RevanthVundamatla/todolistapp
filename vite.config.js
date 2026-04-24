import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://todolist-backend-4q3m.onrender.com',
        changeOrigin: true,
      }
    }
  }
})