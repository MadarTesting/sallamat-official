import { test, expect } from '../../../fixtures/customersList.fixture';
import { CUSTOMER_COLUMN, customersFrom, normalizeArabic } from '../../../pages/CustomersListPage';

// ============================================================
//  العملاء – فلتر "النوع" (ذكر / أنثى)
//  الـ API: filter[gender]=<gender>
//  ملحوظة: الفلتر مكتوب "أنثى" والجدول بيعرض "انثي" ➜ بنقارن بعد توحيد الحروف
// ============================================================
const GENDERS = ['ذكر', 'أنثى'];

test.describe('Customers – Gender filter', () => {

    test('gender filter lists all expected options', async ({ customersList }) => {
        await expect(customersList.filterTrigger('النوع')).toContainText('النوع');
        const options = await customersList.getFilterOptions('النوع');
        expect(options).toEqual(GENDERS);
    });

    for (const gender of GENDERS) {
        test(`gender = ${gender}`, async ({ customersList }) => {
            const res = await customersList.selectFilter('النوع', gender, `filter[gender]=${gender}`);
            expect(res.status()).toBe(200);
            await expect(customersList.filterTrigger('النوع')).toContainText(gender);

            const customers = await customersFrom(res);
            await expect.poll(() => customersList.getRowsCount()).toBe(customers.length);
            await customersList.printTable(`Gender = ${gender}`);

            if (customers.length === 0) {
                test.info().annotations.push({ type: 'note', description: `No customers with gender "${gender}"` });
            }
            for (const c of customers) {
                expect(normalizeArabic(c.gender ?? ''), `Customer #${c.id} gender "${c.gender}"`).toBe(normalizeArabic(gender));
            }
            for (const [i, v] of (await customersList.getColumnValues(CUSTOMER_COLUMN.gender)).entries()) {
                expect(normalizeArabic(v), `Row ${i + 1}: expected "${gender}" but got "${v}"`).toBe(normalizeArabic(gender));
            }
        });
    }
});
