import { test } from '@playwright/test';
import { LoginPage } from './pages/loginpage';
import { TemplatePage } from './pages/TemplatePage';
import testData from './testdata/testdata.json';

// ============================================================
//  إنشاء قالب بفيديو MP4
//  Flow: تسجيل دخول ➜ القوالب ➜ إنشاء ➜ اسم ➜ تفعيل التوجل ➜ فيديو ➜ رفع ➜ محتوى ➜ فوتر ➜ إرسال
// ============================================================
test.describe('Create Template – Video Attachment', () => {

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

    test('Create template with video successfully', async ({ page }) => {

        await templatePage.createTemplate({
            type: 'video',
            filePath: 'tests/fixtures/sample.mp4',
            body: 'Automated Video Content',
            footer: 'Automated Video Footer',
        });

        await templatePage.expectSubmitVisible();
        await templatePage.submitTemplate();

        // البراوزر يفضل مفتوح حتى تضغط Resume
        await page.pause();
    });
});
