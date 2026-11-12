import { test as base, expect } from './campaignsList.fixture';
import { CustomersListPage } from '../pages/CustomersListPage';

/**
 * Fixture لتستات فلاتر العملاء:
 * - نفس الـ session بتاع فلاتر الحملات (login مرة واحدة لكل worker)
 * - طباعة API العملاء في التيرمنال (Payload / Response) – نتيجة أكشن التيست بس، مش تحميل الصفحة
 * - فتح صفحة العملاء من غير فلاتر
 * - بعد التيست: البراوزر يفضل مفتوح (page.pause) إلا لو CI أو NO_PAUSE=1
 *
 * الاستخدام:
 *   test('...', async ({ customersList }) => { ... })
 */
export const test = base.extend<{ customersList: CustomersListPage }>({

    customersList: async ({ page }, use) => {
        base.setTimeout(0);
        const listPage = new CustomersListPage(page);
        await listPage.open();
        // اللوجينج بيبدأ بعد فتح الصفحة ➜ بيتطبع بس نتيجة الأكشن (فلتر / بحث / ترتيب)
        listPage.enableApiLogging({ urlFilter: /\/api\/customers\?/, newOnly: false });

        await use(listPage);

        if (!process.env.CI && process.env.NO_PAUSE !== '1') {
            await page.pause();
        }
    },
});

export { expect };
