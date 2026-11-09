import { test, expect } from '../../../fixtures/manualCampaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – مربع البحث (البحث باسم الحملة)
// ============================================================
test.describe('Manual Campaigns – Search', () => {

    test('search by an existing campaign name shows only matching campaigns', async ({ listPage }) => {
        // ناخد اسم أول حملة في الجدول ونبحث بجزء منه
        const [firstName] = await listPage.getColumnValues(COLUMN.name);
        expect(firstName, 'Table has no campaigns to search for').toBeTruthy();
        const keyword = firstName.slice(0, 12);

        const res = await listPage.search(keyword);
        expect(res.status()).toBe(200);

        await expect.poll(() => listPage.getRowsCount()).toBeGreaterThan(0);
        const names = await listPage.getColumnValues(COLUMN.name);
        for (const name of names) {
            expect(name.toLowerCase()).toContain(keyword.toLowerCase());
        }
        await listPage.printTable(`Search "${keyword}"`);
    });

    test('search by a name that does not exist shows no campaigns', async ({ listPage }) => {
        const res = await listPage.search(`no_such_campaign_${Date.now()}`);
        expect(res.status()).toBe(200);
        await expect.poll(() => listPage.getRowsCount()).toBe(0);
    });

    test('clearing the search shows all campaigns again', async ({ listPage }) => {
        const before = await listPage.getRowsCount();
        await listPage.search(`no_such_campaign_${Date.now()}`);
        await expect.poll(() => listPage.getRowsCount()).toBe(0);

        await listPage.clearSearch();
        await expect.poll(() => listPage.getRowsCount()).toBe(before);
    });
});
