import { test, expect } from '../../../fixtures/customersList.fixture';
import { CUSTOMER_COLUMN, CustomersListPage, customersFrom } from '../../../pages/CustomersListPage';

// ============================================================
//  العملاء – فلتر "تاريخ آخر تعديل"
//  الـ API: filter[updated_at][from] / filter[updated_at][to]
//  من أول الشهر الحالي لحد النهارده
// ============================================================
const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test.describe('Customers – Last updated date filter', () => {

    test('date range from the 1st of this month until today', async ({ customersList }) => {
        const today = new Date();
        const from = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
        const to = fmt(today);

        const res = await customersList.selectDateRange(from, to);
        expect(res.status()).toBe(200);
        const url = CustomersListPage.decodeUrl(res.url());
        expect(url).toContain(`filter[updated_at][from]=${from}`);
        expect(url).toContain(`filter[updated_at][to]=${to}`);
        await expect(customersList.filterTrigger('تاريخ آخر تعديل')).toContainText(`${from} - ${to}`);

        await customersList.printTable(`Updated ${from} ➜ ${to}`);
        const customers = await customersFrom(res);
        for (const c of customers) {
            const day = (c.updated_at ?? '').slice(0, 10);
            expect(day >= from && day <= to, `Customer #${c.id} updated_at ${c.updated_at} is outside ${from} ➜ ${to}`).toBe(true);
        }
        for (const d of await customersList.getColumnValues(CUSTOMER_COLUMN.updatedAt)) {
            const day = d.slice(0, 10);
            expect(day >= from && day <= to, `Row date ${d} is outside ${from} ➜ ${to}`).toBe(true);
        }
    });

    test('a single day shows only customers updated that day', async ({ customersList }) => {
        // ناخد تاريخ آخر تعديل لأول عميل في الجدول ونفلتر بيه
        const [firstDate] = await customersList.getColumnValues(CUSTOMER_COLUMN.updatedAt);
        const day = firstDate.slice(0, 10);
        expect(day, 'Table has no dates').toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // اليوم ده لازم يكون في الشهر المعروض في الكاليندر (الشهر الحالي)
        test.skip(day.slice(0, 7) !== fmt(new Date()).slice(0, 7), `Latest customer date ${day} is not in the current month`);

        // أول ضغطة على يوم = من/إلى نفس اليوم
        await customersList.openFilter('تاريخ آخر تعديل');
        const res = customersList.waitForListApi(`filter[updated_at][from]=${day}&filter[updated_at][to]=${day}`);
        await customersList.openPopover.locator(`td[data-day='${day}'] button`).click();
        const response = await res;
        await customersList.closeFilter();

        expect(response.status()).toBe(200);
        const customers = await customersFrom(response);
        expect(customers.length).toBeGreaterThan(0);
        for (const c of customers) {
            expect((c.updated_at ?? '').slice(0, 10), `Customer #${c.id}`).toBe(day);
        }
        await customersList.printTable(`Updated on ${day}`);
    });
});
