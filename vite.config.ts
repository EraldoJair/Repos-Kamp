import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: mode === 'production' ? 'http://server:3001' : 'http://localhost:3001',
          changeOrigin: true,
          
        },
      },
    },
  };
});
