import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "الحالة"
//  تيست لكل حالة: كل الصفوف اللي بتظهر لازم حالتها = الحالة المختارة
// ============================================================
const STATUSES = ['مسودة', 'مكتملة', 'جاري الارسال', 'متوقفة', 'فشل الارسال', 'مجدولة', 'مؤجلة', 'قيد الانتظار'];

test.describe('Manual Campaigns – Status filter', () => {

    test('status filter lists all expected options', async ({ manualList }) => {
        const options = await manualList.getFilterOptions('الحالة');
        expect(options).toEqual(STATUSES);
    });

    for (const status of STATUSES) {
        test(`status = ${status}`, async ({ manualList }) => {
            const res = await manualList.selectFilter('الحالة', status);
            expect(res.status()).toBe(200);
            await expect(manualList.filterTrigger('الحالة')).toContainText(status);

            await manualList.printTable(`Status = ${status}`);
            const hasRows = await manualList.expectAllRows(COLUMN.status, status);
            if (!hasRows) test.info().annotations.push({ type: 'note', description: `No campaigns with status "${status}"` });
        });
    }
});
