import { test, expect } from '../../../fixtures/manualCampaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – فلتر "نطاق التاريخ"
//  من أول الشهر الحالي لحد النهارده
// ============================================================
const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test.describe('Manual Campaigns – Date range filter', () => {

    test('date range from the 1st of this month until today', async ({ listPage }) => {
        const today = new Date();
        const from = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
        const to = fmt(today);

        const res = await listPage.selectDateRange(from, to);
        expect(res.status()).toBe(200);
        const url = decodeURIComponent(res.url());
        expect(url).toContain(`filter[date][from]=${from}`);
        expect(url).toContain(`filter[date][to]=${to}`);
        await expect(listPage.filterTrigger('نطاق التاريخ')).toContainText(`${from} - ${to}`);

        await listPage.printTable(`Date ${from} ➜ ${to}`);
        const dates = await listPage.getColumnValues(COLUMN.sendDate);
        for (const d of dates) {
            const day = d.slice(0, 10);
            expect(day >= from && day <= to, `Row date ${d} is outside ${from} ➜ ${to}`).toBe(true);
        }
    });
});
