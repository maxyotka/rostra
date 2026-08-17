import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // The legacy test shells out to a full rebuild; 5s is not enough on a cold
    // Windows filesystem and the failure looks like a flake rather than a bug.
    testTimeout: 20000,
  },
})
