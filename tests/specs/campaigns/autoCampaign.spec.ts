import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { AutoCampaignPage } from '../../pages/AutoCampaignPage';
import testData from '../../testdata/testdata.json';

// ============================================================
//  إنشاء حملة تلقائية
//  Flow: تسجيل دخول ➜ الحملات التلقائية ➜ إنشاء حملة تلقائية ➜ الاسم ➜ الوصف ➜
//        العنصر (p) ➜ القالب fffffffffffff + الشيك بوكس ➜ التالي ➜ تفعيل الحملة
// ============================================================
test.describe('Auto Campaign', () => {

    let loginPage: LoginPage;
    let autoCampaignPage: AutoCampaignPage;

    test.beforeEach(async ({ page }) => {
        // بدون timeout عشان البراوزر يفضل مفتوح بعد الرن
        test.setTimeout(0);

        loginPage = new LoginPage(page);
        autoCampaignPage = new AutoCampaignPage(page);

        // طباعة الـ APIs في التيرمنال – الداتا اللي التيست عملها بس (الأكشن + العناصر الجديدة)
        autoCampaignPage.enableApiLogging();
        // أو بفلتر: autoCampaignPage.enableApiLogging({ urlFilter: /campaign/i });

        await loginPage.goto();
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
    });

    // البراوزر يفضل مفتوح بعد الرن (نجح أو فشل) لحد ما تضغط Resume في الـ Inspector
    test.afterEach(async ({ page }) => {
        await page.pause();
    });

    test('Create auto campaign successfully', async () => {
        const result = await autoCampaignPage.createAutoCampaign({
            description: 'Automated auto-campaign description',
            templateName: AutoCampaignPage.DEFAULT_TEMPLATE_NAME, // fffffffffffff دايمًا
        });

        console.log('📋 Campaign data:', JSON.stringify(result, null, 2));
        expect(result.templateName).toBe('fffffffffffff');
    });
});
