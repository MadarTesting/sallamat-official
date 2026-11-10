import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { ManualCampaignsListPage } from '../pages/ManualCampaignsListPage';
import { AutoCampaignsListPage } from '../pages/AutoCampaignsListPage';
import type { CampaignsListPage } from '../pages/CampaignsListPage';
import testData from '../testdata/testdata.json';

/**
 * Fixture لتستات فلاتر الحملات (اليدوية والتلقائية):
 * - تسجيل دخول مرة واحدة بس لكل worker وإعادة استخدام الـ session (storageState)
 *   بدل ما كل تيست يعمل login (الموقع بيرفض logins كتير ورا بعض)
 * - طباعة API القائمة في التيرمنال (Payload / Preview / Response)
 * - فتح الصفحة من غير فلاتر
 * - بعد التيست: البراوزر يفضل مفتوح (page.pause) إلا لو CI أو NO_PAUSE=1
 *
 * الاستخدام:
 *   test('...', async ({ manualList }) => { ... })   // الحملات اليدوية
 *   test('...', async ({ autoList }) => { ... })     // الحملات التلقائية
 */
type Fixtures = {
    manualList: ManualCampaignsListPage;
    autoList: AutoCampaignsListPage;
};

async function openList<T extends CampaignsListPage>(listPage: T, use: (p: T) => Promise<void>) {
    base.setTimeout(0);
    listPage.enableApiLogging({ urlFilter: new RegExp(listPage.config.api.replace(/[?]/g, '\\?')) });
    await listPage.open();

    await use(listPage);

    if (!process.env.CI && process.env.NO_PAUSE !== '1') {
        await listPage.page.pause();
    }
}

export const test = base.extend<Fixtures, { workerStorageState: string }>({

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

    manualList: async ({ page }, use) => openList(new ManualCampaignsListPage(page), use),

    autoList: async ({ page }, use) => openList(new AutoCampaignsListPage(page), use),
});

export { expect };
