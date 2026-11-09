import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { AdPage } from '../../pages/AdPage';
import testData from '../../testdata/testdata.json';

// ============================================================
//  إنشاء إعلان
//  Flow: تسجيل دخول ➜ صندوق الإعلان ➜ إنشاء إعلان ➜ div[1] ×2 ➜
//        الخطوة القادمة ×4 ➜ إطلاق الإعلان
// ============================================================
test.describe('Create Ad', () => {

    let loginPage: LoginPage;
    let adPage: AdPage;

    test.beforeEach(async ({ page }) => {
        // بدون timeout عشان البراوزر يفضل مفتوح بعد الرن
        test.setTimeout(0);

        loginPage = new LoginPage(page);
        adPage = new AdPage(page);

        // طباعة كل API call في التيرمنال (Postman-style)
        adPage.enableApiLogging();
        // أو بفلتر: adPage.enableApiLogging({ urlFilter: /ad/i });

        await loginPage.goto();
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
    });

    // البراوزر يفضل مفتوح بعد الرن (نجح أو فشل) لحد ما تضغط Resume في الـ Inspector
    test.afterEach(async ({ page }) => {
        await page.pause();
    });

    test('Create ad successfully', async () => {
        // الصورة اللي هتترفع في main/div[1] قبل أول "الخطوة القادمة"
        await adPage.createAd('tests/assets/ad-image.png');
    });
});
