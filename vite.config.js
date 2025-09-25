import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/english-wheel-react-1to4teams/', // ← nombre EXACTO del repo
})
