import { test } from '@playwright/test';
import { LoginPage } from './pages/loginpage';
import { TemplatePage } from './pages/TemplatePage';
import testData from './testdata/testdata.json';

// ============================================================
//  إنشاء قالب بنص فقط (بدون مرفق)
//  Flow: تسجيل دخول ➜ القوالب ➜ إنشاء ➜ اسم ➜ تفعيل التوجل ➜ نص ➜ هيدر ➜ محتوى ➜ فوتر ➜ إرسال
// ============================================================
test.describe('Create Template – Text Only', () => {

    let loginPage: LoginPage;
    let templatePage: TemplatePage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        templatePage = new TemplatePage(page);

        // طباعة كل API call في التيرمنال (Postman-style)
        templatePage.enableApiLogging();

        await loginPage.goto();
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
    });

    test('Create template with text only successfully', async ({ page }) => {

        await templatePage.createTemplate({
            type: 'none',           // بدون مرفق – الزر "نص"
            header: 'Automated Text Header',   // header_text-input
            body: 'Automated Text Content',
            footer: 'Automated Text Footer',
        });

        await templatePage.expectSubmitVisible();
        await templatePage.submitTemplate();

        // البراوزر يفضل مفتوح حتى تضغط Resume
        await page.pause();
    });
});
