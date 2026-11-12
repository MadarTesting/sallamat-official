import { test, expect } from '../../../fixtures/customersList.fixture';
import { CustomersListPage, customersFrom } from '../../../pages/CustomersListPage';

// ============================================================
//  العملاء – فلتر "العملاء" (نوع العميل / مصدره)
//  الـ API: filter[type]=<type>  (مثلًا "عملاء ملف إكسل" ➜ "استيراد العملاء")
//  تيست لكل اختيار: كل العملاء اللي راجعين لازم الـ type بتاعهم = قيمة الفلتر
// ============================================================
const TYPES = ['السلات المتروكة', 'العملاء', 'عملاء الإعلان', 'عملاء ملف إكسل'];

test.describe('Customers – Customer type filter', () => {

    test('customer type filter defaults to "الكل" and lists all expected options', async ({ customersList }) => {
        await expect(customersList.filterTrigger('العملاء')).toContainText('الكل');
        const options = await customersList.getFilterOptions('العملاء');
        expect(options).toEqual(TYPES);
    });

    for (const type of TYPES) {
        test(`customer type = ${type}`, async ({ customersList }) => {
            const res = await customersList.selectFilter('العملاء', type, 'filter[type]=');
            expect(res.status()).toBe(200);
            await expect(customersList.filterTrigger('العملاء')).toContainText(type);

            // قيمة الفلتر اللي اتبعتت للـ API
            const apiType = new URL(res.url()).searchParams.get('filter[type]') ?? '';
            console.log(`"${type}" ➜ filter[type] = "${apiType}"`);
            expect(apiType).not.toBe('');
            await expect.poll(() => CustomersListPage.decodeUrl(customersList.page.url())).toContain(`filter[type]=${apiType}`);

            const customers = await customersFrom(res);
            await expect.poll(() => customersList.getRowsCount()).toBe(customers.length);
            await customersList.printTable(`Customer type = ${type}`);

            if (customers.length === 0) {
                test.info().annotations.push({ type: 'note', description: `No customers of type "${type}"` });
            }
            for (const c of customers) {
                expect(c.type, `Customer #${c.id} has type "${c.type}"`).toBe(apiType);
            }
        });
    }
});
