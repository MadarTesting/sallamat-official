import { test, expect } from '../../../fixtures/campaignsList.fixture';
import { campaignsFrom } from '../../../pages/CampaignsListPage';
import type { AutoCampaign } from '../../../pages/AutoCampaignsListPage';

// ============================================================
//  الحملات التلقائية – "الترتيب الزمني"
//  الترتيب بيتم على تاريخ الإنشاء (created_at) من الـ API
// ============================================================
test.describe('Auto Campaigns – Sorting', () => {

    test('oldest to newest sorts by created_at ascending', async ({ autoList }) => {
        const res = await autoList.selectFilter('الترتيب الزمني', 'من الأقدم إلى الأحدث');
        expect(res.status()).toBe(200);
        expect(decodeURIComponent(res.url())).toMatch(/sort=created_at/);
        await expect(autoList.filterTrigger('الترتيب الزمني')).toContainText('من الأقدم إلى الأحدث');

        const dates = (await campaignsFrom<AutoCampaign>(res)).map((c) => c.created_at);
        expect(dates.length).toBeGreaterThan(0);
        expect(dates).toEqual([...dates].sort());
        await autoList.printTable('Oldest ➜ Newest');
    });

    test('newest to oldest is the default and sorts by created_at descending', async ({ autoList }) => {
        await expect(autoList.filterTrigger('الترتيب الزمني')).toContainText('من الأحدث إلى الأقدم');

        const res = autoList.initialResponse!;
        expect(res.status()).toBe(200);
        expect(decodeURIComponent(res.url())).toMatch(/sort=-created_at/);

        const dates = (await campaignsFrom<AutoCampaign>(res)).map((c) => c.created_at);
        expect(dates.length).toBeGreaterThan(0);
        expect(dates).toEqual([...dates].sort().reverse());
        await autoList.printTable('Newest ➜ Oldest');
    });

    test('switching back to newest to oldest restores the original order', async ({ autoList }) => {
        const original = await autoList.getNames();

        await autoList.selectFilter('الترتيب الزمني', 'من الأقدم إلى الأحدث');
        await expect.poll(() => autoList.getNames()).not.toEqual(original);

        // الرجوع للأحدث: الصفحة ممكن تستخدم الداتا المتخزنة (من غير request جديد)
        await autoList.openFilter('الترتيب الزمني');
        await autoList.popoverOption('من الأحدث إلى الأقدم').click();
        await autoList.closeFilter();

        await expect(autoList.filterTrigger('الترتيب الزمني')).toContainText('من الأحدث إلى الأقدم');
        await expect.poll(() => autoList.getNames()).toEqual(original);
    });
});
