import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',fullyParallel:false,workers:1,timeout:45_000,
  expect:{timeout:10_000},reporter:process.env.CI?[['list'],['github']]:[['list']],
  use:{baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:4322',headless:true,viewport:{width:1440,height:1000},trace:'retain-on-failure',launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}},
  webServer:process.env.TEST_BASE_URL?undefined:{command:'python3 -m http.server 4322 --bind 127.0.0.1 --directory dist',url:'http://127.0.0.1:4322',reuseExistingServer:!process.env.CI,timeout:30_000,stdout:'ignore',stderr:'ignore'},
});
