import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { campaignsFrom } from '../../../pages/CampaignsListPage';
import { AUTO_COLUMN, AUTO_EVENTS, type AutoCampaign } from '../../../pages/AutoCampaignsListPage';

// ============================================================
//  الحملات التلقائية – فلتر "الحدث"
//  تيست لكل حدث: كل الصفوف لازم الحدث بتاعها = الحدث المختار
// ============================================================
test.describe('Auto Campaigns – Event filter', () => {

    test('event filter lists all expected options', async ({ autoList }) => {
        expect(await autoList.getFilterOptions('الحدث')).toEqual([...AUTO_EVENTS]);
    });

    for (const event of AUTO_EVENTS) {
        test(`event = ${event}`, async ({ autoList }) => {
            const res = await autoList.selectFilter('الحدث', event);
            expect(res.status()).toBe(200);
            await expect(autoList.filterTrigger('الحدث')).toContainText(event);

            // الـ API
            for (const c of await campaignsFrom<AutoCampaign>(res)) {
                expect(c.event_name, `"${c.name}" has event "${c.event_name}"`).toBe(event);
            }

            // الجدول
            await autoList.printTable(`Event = ${event}`);
            const hasRows = await autoList.expectAllRows(AUTO_COLUMN.event, event);
            if (!hasRows) test.info().annotations.push({ type: 'note', description: `No campaigns with event "${event}"` });
        });
    }
});
