import { test, expect } from '../../../fixtures/campaignsList.fixture';

// ============================================================
//  الحملات التلقائية – مربع البحث (ابحث باسم الحملة)
// ============================================================
test.describe('Auto Campaigns – Search', () => {

    test('search by an existing campaign name shows only matching campaigns', async ({ autoList }) => {
        // ناخد اسم أول حملة في الجدول ونبحث بجزء منه
        const [firstName] = await autoList.getNames();
        expect(firstName, 'Table has no campaigns to search for').toBeTruthy();
        const keyword = firstName.slice(0, 12);

        const res = await autoList.search(keyword);
        expect(res.status()).toBe(200);

        await expect.poll(() => autoList.getRowsCount()).toBeGreaterThan(0);
        for (const name of await autoList.getNames()) {
            expect(name.toLowerCase()).toContain(keyword.toLowerCase());
        }
        await autoList.printTable(`Search "${keyword}"`);
    });

    test('search by a name that does not exist shows no campaigns', async ({ autoList }) => {
        const res = await autoList.search(`no_such_campaign_${Date.now()}`);
        expect(res.status()).toBe(200);
        await expect.poll(() => autoList.getRowsCount()).toBe(0);
    });

    test('clearing the search shows all campaigns again', async ({ autoList }) => {
        const before = await autoList.getRowsCount();
        await autoList.search(`no_such_campaign_${Date.now()}`);
        await expect.poll(() => autoList.getRowsCount()).toBe(0);

        await autoList.clearSearch();
        await expect.poll(() => autoList.getRowsCount()).toBe(before);
    });
});
