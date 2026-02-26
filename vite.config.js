// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite assumes 'public' is the root for static assets, 
  // but you can change it if your CRA project used a different folder
  publicDir: 'public', 
  
  // Optional: Set the base path if your app isn't deployed to the root domain
  // base: '/my-app/', 
})