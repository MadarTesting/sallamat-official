import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TemplatePage } from '../../pages/TemplatePage';
import testData from '../../testdata/testdata.json';

// ============================================================
//  إنشاء قالب بملف PDF
//  Flow: تسجيل دخول ➜ القوالب ➜ إنشاء ➜ اسم ➜ تفعيل التوجل ➜ ملف ➜ رفع ➜ محتوى ➜ فوتر ➜ إرسال
// ============================================================
test.describe('Create Template – File Attachment', () => {

    let loginPage: LoginPage;
    let templatePage: TemplatePage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        templatePage = new TemplatePage(page);

        // طباعة الـ APIs في التيرمنال – الداتا اللي التيست عملها بس (الأكشن + العناصر الجديدة)
        templatePage.enableApiLogging();

        await loginPage.goto();
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
    });

    test('Create template with file (PDF) successfully', async ({ page }) => {

        await templatePage.createTemplate({
            type: 'file',
            filePath: 'tests/assets/sample.pdf',
            body: 'Automated File Content',
            footer: 'Automated File Footer',
        });

        await templatePage.expectSubmitVisible();
        await templatePage.submitTemplate();

        // البراوزر يفضل مفتوح حتى تضغط Resume
        await page.pause();
    });
});
