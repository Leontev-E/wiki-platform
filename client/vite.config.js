import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';  // ← вот его

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),            // ← регистрируем его здесь
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
