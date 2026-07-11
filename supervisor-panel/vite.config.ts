import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isProd = command === 'build';
  return {
    plugins: [react()],
    server: {
      port: 5174,           // ← was 3000 (CONFLICT with NestJS backend!)
      strictPort: false,
      proxy: {
        // Proxy all /api requests to the NestJS backend on port 3000
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 5174,
      strictPort: false,
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        isProd 
          ? 'https://gamechange-workforce-api.onrender.com/api/v1' 
          : 'http://localhost:3001/api/v1'
      ),
    },
  };
});

