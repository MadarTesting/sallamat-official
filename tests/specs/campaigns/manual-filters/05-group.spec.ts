import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "المجموعة"
// ============================================================
const GROUP = 'shady';

test.describe('Manual Campaigns – Group filter', () => {

    test(`group = ${GROUP} shows only its campaigns`, async ({ manualList }) => {
        const res = await manualList.selectFilter('المجموعة', GROUP);
        expect(res.status()).toBe(200);
        expect(decodeURIComponent(res.url())).toContain('filter[group_ids][]');
        await expect(manualList.filterTrigger('المجموعة')).toContainText(GROUP);

        await manualList.printTable(`Group = ${GROUP}`);
        const hasRows = await manualList.expectAllRows(COLUMN.group, GROUP);
        expect(hasRows, `Expected campaigns in group "${GROUP}"`).toBe(true);
    });
});
