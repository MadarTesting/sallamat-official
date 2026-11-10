import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "القالب"
// ============================================================
const TEMPLATE = 'fffffffffffff';

test.describe('Manual Campaigns – Template filter', () => {

    test(`template = ${TEMPLATE} shows only its campaigns`, async ({ manualList }) => {
        const res = await manualList.selectFilter('القالب', TEMPLATE);
        expect(res.status()).toBe(200);
        await expect(manualList.filterTrigger('القالب')).toContainText(TEMPLATE);

        await manualList.printTable(`Template = ${TEMPLATE}`);
        const hasRows = await manualList.expectAllRows(COLUMN.template, TEMPLATE);
        expect(hasRows, `Expected campaigns using template "${TEMPLATE}"`).toBe(true);
    });

    test('template filter search box narrows the options', async ({ manualList }) => {
        await manualList.openFilter('القالب');
        await manualList.openPopover.locator('input').fill(TEMPLATE);
        await expect(manualList.openPopover.locator('span').first()).toBeVisible();
        const options = (await manualList.openPopover.locator('span').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
        await manualList.closeFilter();

        expect(options.length).toBeGreaterThan(0);
        for (const o of options) expect(o).toContain(TEMPLATE);
    });
});
