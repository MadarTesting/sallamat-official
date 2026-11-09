import { test, expect } from '../../../fixtures/manualCampaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "القالب"
// ============================================================
const TEMPLATE = 'fffffffffffff';

test.describe('Manual Campaigns – Template filter', () => {

    test(`template = ${TEMPLATE} shows only its campaigns`, async ({ listPage }) => {
        const res = await listPage.selectFilter('القالب', TEMPLATE);
        expect(res.status()).toBe(200);
        await expect(listPage.filterTrigger('القالب')).toContainText(TEMPLATE);

        await listPage.printTable(`Template = ${TEMPLATE}`);
        const hasRows = await listPage.expectAllRows(COLUMN.template, TEMPLATE);
        expect(hasRows, `Expected campaigns using template "${TEMPLATE}"`).toBe(true);
    });

    test('template filter search box narrows the options', async ({ listPage }) => {
        await listPage.openFilter('القالب');
        await listPage.openPopover.locator('input').fill(TEMPLATE);
        await expect(listPage.openPopover.locator('span').first()).toBeVisible();
        const options = (await listPage.openPopover.locator('span').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
        await listPage.closeFilter();

        expect(options.length).toBeGreaterThan(0);
        for (const o of options) expect(o).toContain(TEMPLATE);
    });
});
