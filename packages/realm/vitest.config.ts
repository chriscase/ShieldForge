import { defineConfig } from 'vitest/config';

// Node environment (server-side crypto via jose); no React/jsdom setup — this
// package is framework-agnostic and has no DOM dependency.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
