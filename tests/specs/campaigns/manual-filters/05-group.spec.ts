import { test, expect } from '../../../fixtures/manualCampaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "المجموعة"
// ============================================================
const GROUP = 'shady';

test.describe('Manual Campaigns – Group filter', () => {

    test(`group = ${GROUP} shows only its campaigns`, async ({ listPage }) => {
        const res = await listPage.selectFilter('المجموعة', GROUP);
        expect(res.status()).toBe(200);
        expect(decodeURIComponent(res.url())).toContain('filter[group_ids][]');
        await expect(listPage.filterTrigger('المجموعة')).toContainText(GROUP);

        await listPage.printTable(`Group = ${GROUP}`);
        const hasRows = await listPage.expectAllRows(COLUMN.group, GROUP);
        expect(hasRows, `Expected campaigns in group "${GROUP}"`).toBe(true);
    });
});
