import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor core
          'vendor-react':  ['react', 'react-dom'],
          // ECharts in its own chunk — largest dep, loads lazily
          'vendor-echarts': ['echarts', 'echarts-for-react'],
        },
      },
    },
    // Raise warning threshold since ECharts is intentionally large
    chunkSizeWarningLimit: 600,
  },
});
