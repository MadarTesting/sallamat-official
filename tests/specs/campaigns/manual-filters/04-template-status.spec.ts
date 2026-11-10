import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "حالة القالب"
// ============================================================
const TEMPLATE_STATUSES = ['معتمد', 'قيد الانتظار', 'متوقف مؤقتا', 'مرفوض', 'معطل'];

test.describe('Manual Campaigns – Template status filter', () => {

    test('template status filter lists all expected options', async ({ manualList }) => {
        const options = await manualList.getFilterOptions('حالة القالب');
        expect(options).toEqual(TEMPLATE_STATUSES);
    });

    for (const status of TEMPLATE_STATUSES) {
        test(`template status = ${status}`, async ({ manualList }) => {
            const res = await manualList.selectFilter('حالة القالب', status);
            expect(res.status()).toBe(200);
            await expect(manualList.filterTrigger('حالة القالب')).toContainText(status);

            await manualList.printTable(`Template status = ${status}`);
            const hasRows = await manualList.expectAllRows(COLUMN.templateStatus, status);
            if (!hasRows) test.info().annotations.push({ type: 'note', description: `No campaigns with template status "${status}"` });
        });
    }
});
