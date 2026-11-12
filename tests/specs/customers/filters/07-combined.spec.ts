import { test, expect } from '../../../fixtures/customersList.fixture';
import { CustomersListPage, customersFrom, normalizeArabic } from '../../../pages/CustomersListPage';

// ============================================================
//  العملاء – أكتر من فلتر مع بعض (بحث + النوع + العملاء)
//  كل فلتر جديد بيتضاف على اللي قبله في نفس الـ request
// ============================================================
test.describe('Customers – Combined filters', () => {

    test('search + gender + customer type are sent together', async ({ customersList }) => {
        await customersList.search('Auto');
        await customersList.selectFilter('النوع', 'أنثى', 'filter[gender]=أنثى');
        const res = await customersList.selectFilter('العملاء', 'عملاء ملف إكسل', 'filter[type]=');
        expect(res.status()).toBe(200);

        const url = CustomersListPage.decodeUrl(res.url());
        console.log('Combined request:', url);
        expect(url).toContain('filter[search]=Auto');
        expect(url).toContain('filter[gender]=أنثى');
        const apiType = new URL(res.url()).searchParams.get('filter[type]');
        expect(apiType).toBeTruthy();

        const customers = await customersFrom(res);
        await expect.poll(() => customersList.getRowsCount()).toBe(customers.length);
        await customersList.printTable('Search "Auto" + أنثى + عملاء ملف إكسل');
        for (const c of customers) {
            expect(`${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()).toContain('auto');
            expect(normalizeArabic(c.gender ?? '')).toBe(normalizeArabic('أنثى'));
            expect(c.type).toBe(apiType);
        }
    });

    test('filters are restored from the URL after reload', async ({ customersList }) => {
        await customersList.selectFilter('النوع', 'ذكر', 'filter[gender]=ذكر');
        await customersList.selectFilter('الترتيب الزمني', 'من الأقدم إلى الأحدث', 'sort=updated_at');

        const res = customersList.waitForListApi('filter[gender]=ذكر');
        await customersList.page.reload({ waitUntil: 'domcontentloaded' });
        const url = CustomersListPage.decodeUrl((await res).url());
        console.log('After reload:', url);
        expect(url).toMatch(/sort=updated_at/);

        await expect(customersList.filterTrigger('النوع')).toContainText('ذكر');
        await expect(customersList.filterTrigger('الترتيب الزمني')).toContainText('من الأقدم إلى الأحدث');
    });
});
