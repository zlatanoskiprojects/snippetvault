import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { motionStudio } from 'motion-studio'

export default defineConfig({
  plugins: [motionStudio(), tailwindcss(), react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@welldone-software/why-did-you-render'],
  },
})
