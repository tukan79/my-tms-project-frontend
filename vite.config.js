import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import removeConsole from 'vite-plugin-remove-console';

// https://vitejs.dev/config/
export default defineConfig({
  base: '', // Zapewnia, że ścieżki do zasobów są generowane poprawnie
  plugins: [
    react(),
    removeConsole(), // Usuwa console.log na produkcji
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist', // Domyślna wartość, ale dobrze jest ją mieć jawnie
    emptyOutDir: true, // Czyści katalog 'dist' przed każdą budową
  },
  server: {
    host: true, // Umożliwia dostęp do serwera deweloperskiego z innych urządzeń w sieci
  },
});
// ostatnia zmiana (30.05.2024, 13:14:12)