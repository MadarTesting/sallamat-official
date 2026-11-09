import { test, expect } from '../../../fixtures/manualCampaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "الحالة"
//  تيست لكل حالة: كل الصفوف اللي بتظهر لازم حالتها = الحالة المختارة
// ============================================================
const STATUSES = ['مسودة', 'مكتملة', 'جاري الارسال', 'متوقفة', 'فشل الارسال', 'مجدولة', 'مؤجلة', 'قيد الانتظار'];

test.describe('Manual Campaigns – Status filter', () => {

    test('status filter lists all expected options', async ({ listPage }) => {
        const options = await listPage.getFilterOptions('الحالة');
        expect(options).toEqual(STATUSES);
    });

    for (const status of STATUSES) {
        test(`status = ${status}`, async ({ listPage }) => {
            const res = await listPage.selectFilter('الحالة', status);
            expect(res.status()).toBe(200);
            await expect(listPage.filterTrigger('الحالة')).toContainText(status);

            await listPage.printTable(`Status = ${status}`);
            const hasRows = await listPage.expectAllRows(COLUMN.status, status);
            if (!hasRows) test.info().annotations.push({ type: 'note', description: `No campaigns with status "${status}"` });
        });
    }
});
