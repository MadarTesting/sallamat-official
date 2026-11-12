import { test, expect } from '../../../fixtures/customersList.fixture';
import { CUSTOMER_COLUMN, CustomersListPage, customersFrom } from '../../../pages/CustomersListPage';

// ============================================================
//  العملاء – "الترتيب الزمني"
//  الترتيب بيتم على تاريخ آخر تعديل (updated_at)
//  الأقدم ➜ sort=updated_at  |  الأحدث (الافتراضي) ➜ sort=-updated_at
// ============================================================
test.describe('Customers – Sorting', () => {

    test('sorting filter lists both options', async ({ customersList }) => {
        const options = await customersList.getFilterOptions('الترتيب الزمني');
        expect(options).toEqual(['من الأقدم إلى الأحدث', 'من الأحدث إلى الأقدم']);
    });

    test('newest to oldest is the default and sorts by updated_at descending', async ({ customersList }) => {
        await expect(customersList.filterTrigger('الترتيب الزمني')).toContainText('من الأحدث إلى الأقدم');

        const res = customersList.initialResponses[0];
        expect(res, 'Customers list was not loaded').toBeTruthy();
        expect(res.status()).toBe(200);
        expect(CustomersListPage.decodeUrl(res.url())).toMatch(/sort=-updated_at/);

        const dates = (await customersFrom(res)).map((c) => c.updated_at ?? '');
        console.log('updated_at (desc):', dates);
        expect(dates.length).toBeGreaterThan(0);
        expect(dates).toEqual([...dates].sort().reverse());

        const shown = await customersList.getColumnValues(CUSTOMER_COLUMN.updatedAt);
        expect(shown).toEqual([...shown].sort().reverse());
        await customersList.printTable('Newest ➜ Oldest');
    });

    test('oldest to newest sorts by updated_at ascending', async ({ customersList }) => {
        const res = await customersList.selectFilter('الترتيب الزمني', 'من الأقدم إلى الأحدث', 'sort=updated_at');
        expect(res.status()).toBe(200);
        await expect(customersList.filterTrigger('الترتيب الزمني')).toContainText('من الأقدم إلى الأحدث');

        const dates = (await customersFrom(res)).map((c) => c.updated_at ?? '');
        console.log('updated_at (asc):', dates);
        expect(dates.length).toBeGreaterThan(0);
        expect(dates).toEqual([...dates].sort());

        await expect.poll(async () => {
            const shown = await customersList.getColumnValues(CUSTOMER_COLUMN.updatedAt);
            return shown.length > 0 && shown.join() === [...shown].sort().join();
        }).toBe(true);
        await customersList.printTable('Oldest ➜ Newest');
    });

    test('switching back to newest to oldest restores the original order', async ({ customersList }) => {
        const original = await customersList.getColumnValues(CUSTOMER_COLUMN.name);

        await customersList.selectFilter('الترتيب الزمني', 'من الأقدم إلى الأحدث', 'sort=updated_at');
        await expect.poll(() => customersList.getColumnValues(CUSTOMER_COLUMN.name)).not.toEqual(original);

        // الرجوع للأحدث: ممكن الصفحة تستخدم الداتا المتخزنة (من غير request جديد)
        await customersList.openFilter('الترتيب الزمني');
        await customersList.popoverOption('من الأحدث إلى الأقدم').click();
        await customersList.closeFilter();

        await expect(customersList.filterTrigger('الترتيب الزمني')).toContainText('من الأحدث إلى الأقدم');
        await expect.poll(() => customersList.getColumnValues(CUSTOMER_COLUMN.name)).toEqual(original);
    });
});
