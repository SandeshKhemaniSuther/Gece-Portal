import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sahi tareeqa: react() function ko call karna zaroori hai
export default defineConfig({
  plugins: [react()], // ✅ CORRECT (brackets zaroori hain)
})