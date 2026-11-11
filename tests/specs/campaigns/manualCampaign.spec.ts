import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ManualCampaignPage } from '../../pages/ManualCampaignPage';
import testData from '../../testdata/testdata.json';

test.describe('Manual Campaign Tests', () => {
    let loginPage: LoginPage;
    let manualCampaignPage: ManualCampaignPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        manualCampaignPage = new ManualCampaignPage(page);

        await loginPage.goto();
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
    });

    test('Create Manual Campaign Successfully', async ({ page }) => {
        const campaignName = `Auto Campaign ${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const templateToSelect = ManualCampaignPage.DEFAULT_TEMPLATE_NAME;

        // طباعة الـ APIs في التيرمنال – الداتا اللي التيست عملها بس (الأكشن + العناصر الجديدة)
        // كل الـ APIs من غير تصفية: enableApiLogging({ newOnly: false })
        manualCampaignPage.enableApiLogging();
        // أو بفلتر معين (مثلًا الحملات بس):
        // manualCampaignPage.enableApiLogging({ urlFilter: /campaign/i });

        // Step 1: فتح الحملات اليدوية وإنشاء حملة
        await manualCampaignPage.openManualCampaigns();
        await manualCampaignPage.clickCreateManualCampaign();

        // Step 2: اسم الحملة
        await manualCampaignPage.fillCampaignName(campaignName);
        await manualCampaignPage.clickNext();

        // Step 3: اختيار أول جمهور متاح
        await manualCampaignPage.selectAudience();
        await manualCampaignPage.clickNext();

        // Step 4: اختيار القالب المحدد (دايمًا نفس القالب)
        const selectedTemplate = await manualCampaignPage.selectTemplate(templateToSelect);
        expect(selectedTemplate).toBe(templateToSelect);
        console.log(`Selected template: ${selectedTemplate}`);
        await manualCampaignPage.clickNext();

        // Step 5: إنشاء الحملة
        await manualCampaignPage.clickCreateCampaign();

        // التحقق: اسم الحملة الجديدة يظهر في الصفحة
        await expect(page.getByText(campaignName).first()).toBeVisible({ timeout: 15000 });
        await page.pause();
    });
});