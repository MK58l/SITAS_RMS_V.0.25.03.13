import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,  // Ensure external access if needed
    port: 5173,  // Set to 5173 as you want
    strictPort: true,  // Ensures it uses the exact port
    hmr: {
      clientPort: 443,  // Custom HMR port
    },
  },
  preview: {
    port: 5173,  // Ensure preview also runs on port 5173
    strictPort: true,
    host: true,
  }
});
