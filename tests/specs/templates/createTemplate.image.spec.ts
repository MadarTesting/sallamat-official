import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TemplatePage } from '../../pages/TemplatePage';
import testData from '../../testdata/testdata.json';

// ============================================================
//  إنشاء قالب بصورة (image)
//  Flow: تسجيل دخول ➜ القوالب ➜ إنشاء ➜ اسم ➜ تفعيل التوجل ➜ صورة ➜ رفع ➜ محتوى ➜ فوتر ➜ إرسال
// ============================================================
test.describe('Create Template – Image Attachment', () => {

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

    test('Create template with image successfully', async ({ page }) => {

        await templatePage.createTemplate({
            type: 'image',
            filePath: 'tests/assets/sample.png',
            body: 'Automated Image Content',
            footer: 'Automated Image Footer',
        });

        await templatePage.expectSubmitVisible();
        await templatePage.submitTemplate();

        // البراوزر يفضل مفتوح حتى تضغط Resume
        await page.pause();
    });
});
