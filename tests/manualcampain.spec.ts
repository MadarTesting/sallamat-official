
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

        // Generate Unique Campaign Name
        const randomNum = Math.floor(Math.random() * 10000);
        const campaignName = `Auto Campaign ${Date.now()}_${randomNum}`;

        // Step 1: Open Manual Campaigns
        await manualCampaignPage.openManualCampaigns();

        // Step 2: Create Manual Campaign
        await manualCampaignPage.clickCreateManualCampaign();

        // Step 3: Fill Campaign Name
        await manualCampaignPage.fillCampaignName(campaignName);
        await page.locator("//button[contains(text(),'التالي')]").click();
        await page.locator("//span[normalize-space()='pop mo']").click();
        await page.locator("//button[contains(text(),'التالي')]").click();
        await page.locator("//h3[normalize-space()='oprah_rowland22_oprah_rowland22']").click();
        await page.locator("//button[contains(text(),'التالي')]").click();
        await page.locator("//button[contains(text(),'إنشاء الحملة')]").click();
        await page.pause();

    });

});
