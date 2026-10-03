import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e',fullyParallel:false,retries:process.env.CI?1:0,
  use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://localhost:3000',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
  reporter:[['list'],['html',{open:'never'}]],
  webServer:process.env.PLAYWRIGHT_BASE_URL?undefined:{command:'pnpm start',url:'http://localhost:3000',reuseExistingServer:!process.env.CI,timeout:120000},
});
