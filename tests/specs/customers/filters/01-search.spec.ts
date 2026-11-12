import { test, expect } from '../../../fixtures/customersList.fixture';
import { CUSTOMER_COLUMN, CustomersListPage, customersFrom } from '../../../pages/CustomersListPage';

// ============================================================
//  العملاء – مربع البحث (ابحث باسم العميل أو رقم الهاتف)
//  الـ API: filter[search]=<text>
// ============================================================
const digits = (s: string) => s.replace(/\D/g, '');

test.describe('Customers – Search', () => {

    test('search by an existing customer name shows only matching customers', async ({ customersList }) => {
        // ناخد اسم أول عميل في الجدول ونبحث بجزء منه
        const [firstName] = await customersList.getColumnValues(CUSTOMER_COLUMN.name);
        expect(firstName, 'Table has no customers to search for').toBeTruthy();
        const keyword = firstName.slice(0, 10).trim();

        const res = await customersList.search(keyword);
        expect(res.status()).toBe(200);

        const customers = await customersFrom(res);
        expect(customers.length).toBeGreaterThan(0);
        for (const c of customers) {
            const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
            expect(fullName, `Customer #${c.id} does not match "${keyword}"`).toContain(keyword.toLowerCase());
        }

        await expect.poll(() => customersList.getRowsCount()).toBe(customers.length);
        for (const name of await customersList.getColumnValues(CUSTOMER_COLUMN.name)) {
            expect(name.toLowerCase()).toContain(keyword.toLowerCase());
        }
        await customersList.printTable(`Search "${keyword}"`);
    });

    test('search by an existing phone number shows that customer', async ({ customersList }) => {
        // رقم الهاتف في الجدول بالشكل "+966 5xxxxxxxx" ➜ بنبحث بالرقم من غير كود الدولة
        const [firstPhone] = await customersList.getColumnValues(CUSTOMER_COLUMN.phone);
        const mobile = digits(firstPhone.split(' ').pop() ?? '');
        expect(mobile, 'Table has no phone numbers to search for').toBeTruthy();

        const res = await customersList.search(mobile);
        expect(res.status()).toBe(200);

        const customers = await customersFrom(res);
        expect(customers.length).toBeGreaterThan(0);
        for (const c of customers) {
            expect(c.mobile ?? '', `Customer #${c.id} phone does not match`).toContain(mobile);
        }

        await expect.poll(() => customersList.getRowsCount()).toBe(customers.length);
        for (const phone of await customersList.getColumnValues(CUSTOMER_COLUMN.phone)) {
            expect(digits(phone)).toContain(mobile);
        }
        await customersList.printTable(`Search phone "${mobile}"`);
    });

    test('search text is kept in the page URL', async ({ customersList }) => {
        await customersList.search('Auto');
        await expect.poll(() => CustomersListPage.decodeUrl(customersList.page.url())).toContain('filter[search]=Auto');
        await expect(customersList.searchInput).toHaveValue('Auto');
    });

    test('search by a name that does not exist shows no customers', async ({ customersList }) => {
        const res = await customersList.search(`no_such_customer_${Date.now()}`);
        expect(res.status()).toBe(200);
        expect(await customersFrom(res)).toHaveLength(0);
        await expect.poll(() => customersList.getRowsCount()).toBe(0);
    });

    test('clearing the search shows all customers again', async ({ customersList }) => {
        const before = await customersList.getColumnValues(CUSTOMER_COLUMN.name);
        await customersList.search(`no_such_customer_${Date.now()}`);
        await expect.poll(() => customersList.getRowsCount()).toBe(0);

        await customersList.clearSearch();
        await expect.poll(() => customersList.getRowsCount()).toBeGreaterThan(0);
        // أول صفوف الجدول ترجع زي ما كانت
        await expect.poll(async () => (await customersList.getColumnValues(CUSTOMER_COLUMN.name)).slice(0, 5))
            .toEqual(before.slice(0, 5));
    });
});
