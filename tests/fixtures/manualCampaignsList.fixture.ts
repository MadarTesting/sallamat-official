import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { ManualCampaignsListPage } from '../pages/ManualCampaignsListPage';
import testData from '../testdata/testdata.json';

/**
 * Fixture لتستات فلاتر الحملات اليدوية:
 * - تسجيل دخول مرة واحدة بس لكل worker وإعادة استخدام الـ session (storageState)
 *   بدل ما كل تيست يعمل login (الموقع بيرفض logins كتير ورا بعض)
 * - طباعة API الحملات في التيرمنال (Postman-style)
 * - فتح صفحة الحملات اليدوية من غير فلاتر
 * - بعد التيست: البراوزر يفضل مفتوح (page.pause) إلا لو CI أو NO_PAUSE=1
 */
export const test = base.extend<{ listPage: ManualCampaignsListPage }, { workerStorageState: string }>({

    // كل التستات في الـ worker بتستخدم نفس الـ session
    storageState: ({ workerStorageState }, use) => use(workerStorageState),

    workerStorageState: [async ({ browser }, use, workerInfo) => {
        const file = path.resolve(workerInfo.project.outputDir, `.auth/worker-${workerInfo.parallelIndex}.json`);
        fs.mkdirSync(path.dirname(file), { recursive: true });

        const page = await browser.newPage({ storageState: undefined });
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
        await page.context().storageState({ path: file });
        await page.close();

        await use(file);
    }, { scope: 'worker' }],

    listPage: async ({ page }, use) => {
        test.setTimeout(0);

        const listPage = new ManualCampaignsListPage(page);
        listPage.enableApiLogging({ urlFilter: /\/api\/campaign\?/ });
        await listPage.open();

        await use(listPage);

        if (!process.env.CI && process.env.NO_PAUSE !== '1') {
            await page.pause();
        }
    },
});

export { expect };
