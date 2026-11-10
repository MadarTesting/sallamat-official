import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { COLUMN } from '../../../pages/ManualCampaignsListPage';

// ============================================================
//  الحملات اليدوية – "الترتيب الزمني"
//  الترتيب بيتم على تاريخ الإنشاء (created_at) من الـ API
// ============================================================
type Campaign = { name?: string; created_at?: string };

async function campaignsFrom(res: { json(): Promise<any> }): Promise<Campaign[]> {
    const body = await res.json();
    return (body?.data?.data ?? body?.data ?? []) as Campaign[];
}

test.describe('Manual Campaigns – Sorting', () => {

    test('oldest to newest sorts by created_at ascending', async ({ manualList }) => {
        const res = await manualList.selectFilter('الترتيب الزمني', 'من الأقدم إلى الأحدث');
        expect(res.status()).toBe(200);
        expect(decodeURIComponent(res.url())).toMatch(/sort=created_at/);
        await expect(manualList.filterTrigger('الترتيب الزمني')).toContainText('من الأقدم إلى الأحدث');

        const dates = (await campaignsFrom(res)).map((c) => c.created_at ?? '');
        console.log('created_at (asc):', dates);
        expect(dates.length).toBeGreaterThan(0);
        expect(dates).toEqual([...dates].sort());
        await manualList.printTable('Oldest ➜ Newest');
    });

    test('newest to oldest is the default and sorts by created_at descending', async ({ manualList }) => {
        // الترتيب الافتراضي لما الصفحة تفتح
        await expect(manualList.filterTrigger('الترتيب الزمني')).toContainText('من الأحدث إلى الأقدم');

        const res = manualList.initialResponse!;
        expect(res.status()).toBe(200);
        expect(decodeURIComponent(res.url())).toMatch(/sort=-created_at/);

        const dates = (await campaignsFrom(res)).map((c) => c.created_at ?? '');
        console.log('created_at (desc):', dates);
        expect(dates.length).toBeGreaterThan(0);
        expect(dates).toEqual([...dates].sort().reverse());
        await manualList.printTable('Newest ➜ Oldest');
    });

    test('switching back to newest to oldest restores the original order', async ({ manualList }) => {
        const original = await manualList.getColumnValues(COLUMN.name);

        await manualList.selectFilter('الترتيب الزمني', 'من الأقدم إلى الأحدث');
        await expect.poll(() => manualList.getColumnValues(COLUMN.name)).not.toEqual(original);

        // الرجوع للأحدث: الصفحة بتستخدم الداتا المتخزنة (مفيش request جديد)
        await manualList.openFilter('الترتيب الزمني');
        await manualList.popoverOption('من الأحدث إلى الأقدم').click();
        await manualList.closeFilter();

        await expect(manualList.filterTrigger('الترتيب الزمني')).toContainText('من الأحدث إلى الأقدم');
        await expect.poll(() => manualList.getColumnValues(COLUMN.name)).toEqual(original);
    });
});
