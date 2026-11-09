import { test, expect } from '../../../fixtures/manualCampaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "حالة القالب"
// ============================================================
const TEMPLATE_STATUSES = ['معتمد', 'قيد الانتظار', 'متوقف مؤقتا', 'مرفوض', 'معطل'];

test.describe('Manual Campaigns – Template status filter', () => {

    test('template status filter lists all expected options', async ({ listPage }) => {
        const options = await listPage.getFilterOptions('حالة القالب');
        expect(options).toEqual(TEMPLATE_STATUSES);
    });

    for (const status of TEMPLATE_STATUSES) {
        test(`template status = ${status}`, async ({ listPage }) => {
            const res = await listPage.selectFilter('حالة القالب', status);
            expect(res.status()).toBe(200);
            await expect(listPage.filterTrigger('حالة القالب')).toContainText(status);

            await listPage.printTable(`Template status = ${status}`);
            const hasRows = await listPage.expectAllRows(COLUMN.templateStatus, status);
            if (!hasRows) test.info().annotations.push({ type: 'note', description: `No campaigns with template status "${status}"` });
        });
    }
});
