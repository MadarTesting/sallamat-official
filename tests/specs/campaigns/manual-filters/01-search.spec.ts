import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – مربع البحث (البحث باسم الحملة)
// ============================================================
test.describe('Manual Campaigns – Search', () => {

    test('search by an existing campaign name shows only matching campaigns', async ({ manualList }) => {
        // ناخد اسم أول حملة في الجدول ونبحث بجزء منه
        const [firstName] = await manualList.getColumnValues(COLUMN.name);
        expect(firstName, 'Table has no campaigns to search for').toBeTruthy();
        const keyword = firstName.slice(0, 12);

        const res = await manualList.search(keyword);
        expect(res.status()).toBe(200);

        await expect.poll(() => manualList.getRowsCount()).toBeGreaterThan(0);
        const names = await manualList.getColumnValues(COLUMN.name);
        for (const name of names) {
            expect(name.toLowerCase()).toContain(keyword.toLowerCase());
        }
        await manualList.printTable(`Search "${keyword}"`);
    });

    test('search by a name that does not exist shows no campaigns', async ({ manualList }) => {
        const res = await manualList.search(`no_such_campaign_${Date.now()}`);
        expect(res.status()).toBe(200);
        await expect.poll(() => manualList.getRowsCount()).toBe(0);
    });

    test('clearing the search shows all campaigns again', async ({ manualList }) => {
        const before = await manualList.getRowsCount();
        await manualList.search(`no_such_campaign_${Date.now()}`);
        await expect.poll(() => manualList.getRowsCount()).toBe(0);

        await manualList.clearSearch();
        await expect.poll(() => manualList.getRowsCount()).toBe(before);
    });
});
