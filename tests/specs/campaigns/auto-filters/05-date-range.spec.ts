import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { AUTO_COLUMN } from '../../../pages/AutoCampaignsListPage';

// ============================================================
//  الحملات التلقائية – فلتر "نطاق التاريخ"
//  من أول الشهر الحالي لحد النهارده – على عمود "تاريخ الإنشاء"
// ============================================================
const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test.describe('Auto Campaigns – Date range filter', () => {

    test('date range from the 1st of this month until today', async ({ autoList }) => {
        const today = new Date();
        const from = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
        const to = fmt(today);

        const res = await autoList.selectDateRange(from, to);
        expect(res.status()).toBe(200);
        const url = decodeURIComponent(res.url());
        expect(url).toContain(`filter[date][from]=${from}`);
        expect(url).toContain(`filter[date][to]=${to}`);
        await expect(autoList.filterTrigger('نطاق التاريخ')).toContainText(`${from} - ${to}`);

        await autoList.printTable(`Date ${from} ➜ ${to}`);
        for (const d of await autoList.getColumnValues(AUTO_COLUMN.createdAt)) {
            const day = d.slice(0, 10);
            expect(day >= from && day <= to, `Row date ${d} is outside ${from} ➜ ${to}`).toBe(true);
        }
    });
});
