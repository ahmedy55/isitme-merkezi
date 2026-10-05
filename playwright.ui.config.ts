import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'ui-data-flow.spec.ts',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  timeout: 45_000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --hostname localhost --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:3001',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'playwright-public-anon-key',
    },
  },
});
