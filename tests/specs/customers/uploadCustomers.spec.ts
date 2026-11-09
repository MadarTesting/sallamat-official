import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../../pages/LoginPage';
import { CustomersPage } from '../../pages/CustomersPage';
import { fillCustomersTemplate, generateCustomers } from '../../utils/excelHelper';
import testData from '../../testdata/testdata.json';

// ============================================================
//  رفع بيانات العملاء يدويًا (Excel)
//  Flow: تسجيل دخول ➜ العملاء ➜ رفع البيانات يدويًا ➜ اضغط للتنزيل ➜
//        ملى الملف بالداتا ➜ رفع الملف ➜ تأكيد ➜ التأكد إن العملاء ظهروا
// ============================================================
test.describe('Customers – Manual Excel Upload', () => {

    let loginPage: LoginPage;
    let customersPage: CustomersPage;

    test.beforeEach(async ({ page }) => {
        // بدون timeout عشان البراوزر يفضل مفتوح بعد الرن
        test.setTimeout(0);

        loginPage = new LoginPage(page);
        customersPage = new CustomersPage(page);

        // طباعة كل API call في التيرمنال (Postman-style)
        customersPage.enableApiLogging();

        await loginPage.goto();
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
    });

    // البراوزر يفضل مفتوح بعد الرن (نجح أو فشل) لحد ما تضغط Resume في الـ Inspector
    test.afterEach(async ({ page }) => {
        await page.pause();
    });

    test('Upload customers Excel file successfully', async ({}, testInfo) => {
        // 1) العملاء ➜ رفع البيانات يدويًا
        await customersPage.openCustomers();
        await customersPage.clickManualUpload();

        // 2) اضغط للتنزيل ➜ ملف الإكسل الفاضي
        fs.mkdirSync(testInfo.outputDir, { recursive: true });
        const templatePath = await customersPage.downloadTemplate(testInfo.outputDir);

        // 3) ملى الملف بالداتا
        const customers = generateCustomers(3);
        const filledPath = path.join(testInfo.outputDir, `customers-filled-${Date.now()}.xlsx`);
        const { headers, rows } = await fillCustomersTemplate(templatePath, filledPath, customers);

        console.log('\n📄 Excel headers:', headers);
        console.log('📝 Data written to Excel:');
        console.table(rows);

        // 4) رفع الملف ➜ تأكيد
        await customersPage.uploadFile(filledPath);
        await customersPage.confirm();

        // 5) التأكد إن أول عميل ظهر في الجدول
        await customersPage.expectCustomerVisible(customers[0].name);
    });
});
