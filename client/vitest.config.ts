import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['default', 'html'],
    outputFile: path.resolve(import.meta.dirname, '../test-logs/client-ui/index.html'),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: path.resolve(import.meta.dirname, '../test-logs/client-coverage'),
      include: [
        'src/components/food/FoodFlashCard.tsx',
        'src/components/tinder/TinderCard.tsx',
        'src/components/tinder/TinderControls.tsx',
        'src/components/tinder/TinderGame.tsx',
        'src/components/tinder/TinderMatchModal.tsx',
        'src/components/home/HomeTabs.tsx',
        'src/components/home/GameSettingsDialog.tsx',
        'src/components/ui/UnderlineTabs.tsx',
        'src/components/ui/data-pagination.tsx',
        'src/context/GameSettingsContext.tsx',
        'src/lib/foodAdapter.ts',
        'src/lib/foodData.ts',
        'src/lib/validation.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
