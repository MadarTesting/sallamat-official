import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';
import { installArabicTerminalFix } from './tests/utils/arabicTerminal';

/**
 * العربي في التيرمنال (Windows): الـ console بيشتغل بـ code page قديم فالحروف العربي بتظهر ????.
 * بنحوّله لـ UTF-8 (65001) مرة واحدة هنا عشان يتطبق على المشروع كله (كل الـ specs والـ logs والـ console.table).
 * الـ workers بتورّث نفس الـ console فمفيش حاجة تانية مطلوبة.
 */
if (process.platform === 'win32') {
  try { execSync('chcp 65001', { stdio: 'ignore' }); } catch { /* مش مشكلة لو فشل */ }
}
process.stdout.setDefaultEncoding?.('utf8');
process.stderr.setDefaultEncoding?.('utf8');

/**
 * العربي بيتعرض مقطّع ومعكوس في تيرمنال VS Code ➜ بنوصّل الحروف ونعكس الاتجاه قبل الطباعة.
 * بيتعمل في الـ process الرئيسي بس (هو اللي بيطبع كل حاجة في التيرمنال، حتى logs الـ workers).
 * الـ HTML report بيفضل بالعربي الأصلي. ARABIC_RAW=1 ➜ يطفيه.
 */
if (!process.env.TEST_WORKER_INDEX) installArabicTerminalFix();

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* كل التستات جوه tests/specs/<feature> */
  testDir: './tests/specs',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* list = يطبع الـ console.log (الـ APIs) في التيرمنال، html = التقرير */
  /* الريبورت بيتعمل بعد كل رن (نجاح أو فشل) ويفتح لوحده في playwright-report/index.html */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'always' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* البراوزر يفضل مفتوح ومرئي أثناء الرن */
    /* HEADLESS=1 أو CI ➜ من غير ما البراوزر يظهر */
    headless: !!process.env.CI || process.env.HEADLESS === '1',

    /* لو التيست فشل: سكرين شوت + فيديو + trace بيتحفظوا ويظهروا في الريبورت */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },



    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
