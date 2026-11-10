import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { AUTO_COLUMN, AUTO_TEMPLATE_STATUSES } from '../../../pages/AutoCampaignsListPage';

// ============================================================
//  الحملات التلقائية – فلتر "حالة القالب"
//  (لاحظ: "متوقف مؤقتاً" هنا بالتنوين – في الحملات اليدوية من غير تنوين)
// ============================================================
test.describe('Auto Campaigns – Template status filter', () => {

    test('template status filter lists all expected options', async ({ autoList }) => {
        expect(await autoList.getFilterOptions('حالة القالب')).toEqual([...AUTO_TEMPLATE_STATUSES]);
    });

    for (const status of AUTO_TEMPLATE_STATUSES) {
        test(`template status = ${status}`, async ({ autoList }) => {
            const res = await autoList.selectFilter('حالة القالب', status);
            expect(res.status()).toBe(200);
            await expect(autoList.filterTrigger('حالة القالب')).toContainText(status);

            await autoList.printTable(`Template status = ${status}`);
            const hasRows = await autoList.expectAllRows(AUTO_COLUMN.templateStatus, status);
            if (!hasRows) test.info().annotations.push({ type: 'note', description: `No campaigns with template status "${status}"` });
        });
    }
});
