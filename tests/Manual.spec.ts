import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/loginpage';
import { ManualCampaignPage } from './pages/ManualCampaignPage';
import testData from './testdata/testdata.json';

test.describe('Manual Campaign Tests', () => {

    let loginPage: LoginPage;
    let manualCampaignPage: ManualCampaignPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        manualCampaignPage = new ManualCampaignPage(page);

        // Login
        await loginPage.goto();
        await loginPage.login(
            testData.validUser.email,
            testData.validUser.password
        );
        await loginPage.expectLoggedIn();
    });

    test('Create Manual Campaign Successfully', async ({ page }) => {
        // --- توليد اسم حملة عشوائي وفريد في كل رن ---
        const randomNum = Math.floor(Math.random() * 10000);
        const campaignName = `Auto Campaign ${Date.now()}_${randomNum}`;

        // Step 1: Open Manual Campaigns
        await manualCampaignPage.openManualCampaigns();

        // Step 2: Create Manual Campaign
        await manualCampaignPage.clickCreateManualCampaign();

        // Step 3: Fill Campaign Name (بالاسم العشوائي الجديد)
        await manualCampaignPage.fillCampaignName(campaignName);

        // Step 4: Next (from Setup to Audience)
        await manualCampaignPage.clickNext();

        // Step 5: Select Audience
        await manualCampaignPage.selectAudience();

        // Step 6: Next (from Audience to Template)
        await manualCampaignPage.clickNext();

        // Step 3 (Template Selection): اختيار أول قالب متاح
        const firstTemplateHeading = page.locator('h3').filter({ hasText: /_|_/ }).first();
        if (await firstTemplateHeading.isVisible()) {
            await firstTemplateHeading.click();
        }

        // Step 7: Next (from Template to Review)
        await manualCampaignPage.clickNext();

        // الانتظار حتى تستقر الصفحة النهائية
        await page.waitForLoadState('networkidle');

        // Step 8: Create Campaign
        await manualCampaignPage.expectCreateCampaignVisible();
        await manualCampaignPage.clickCreateCampaign();
        await page.pause();
    });

});