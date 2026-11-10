import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { campaignsFrom } from '../../../pages/CampaignsListPage';
import { AUTO_COLUMN, AUTO_STATUS, type AutoCampaign, type AutoStatus } from '../../../pages/AutoCampaignsListPage';

// ============================================================
//  الحملات التلقائية – فلتر "الحالة"
//  عمود الحالة في الجدول عبارة عن زرار:
//    مفعلة ➜ "إيقاف"   |   غير مفعلة / متوقفة ➜ "تشغيل"
//  فبنتأكد من الحالة الحقيقية من الـ API (status) + نص الزرار في الجدول
// ============================================================
const STATUSES = Object.keys(AUTO_STATUS) as AutoStatus[];

test.describe('Auto Campaigns – Status filter', () => {

    test('status filter lists all expected options', async ({ autoList }) => {
        expect(await autoList.getFilterOptions('الحالة')).toEqual(STATUSES);
    });

    for (const status of STATUSES) {
        test(`status = ${status}`, async ({ autoList }) => {
            const { api, button } = AUTO_STATUS[status];

            const res = await autoList.selectFilter('الحالة', status);
            expect(res.status()).toBe(200);
            await expect(autoList.filterTrigger('الحالة')).toContainText(status);

            // الـ API: كل الحملات حالتها = الحالة المختارة
            const campaigns = await campaignsFrom<AutoCampaign>(res);
            for (const c of campaigns) {
                expect(c.status, `"${c.name}" has status "${c.status}"`).toBe(api);
            }

            // الجدول: كل الصفوف عليها نفس الزرار
            await autoList.printTable(`Status = ${status} (${api})`);
            const hasRows = await autoList.expectAllRows(AUTO_COLUMN.status, button);
            if (!hasRows) test.info().annotations.push({ type: 'note', description: `No campaigns with status "${status}"` });
        });
    }
});
