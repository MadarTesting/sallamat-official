import { test, expect } from '../../../fixtures/customersList.fixture';
import { CustomersListPage, customersFrom, type Customer } from '../../../pages/CustomersListPage';

// ============================================================
//  العملاء – فلتر "الحملات"
//  الحملات بتيجي من API منفصل، اختيار واحد أو أكتر (checkbox) ➜ حفظ
//  الـ API: filter[campaign_ids][]=<id>
// ============================================================
test.describe('Customers – Campaign filter', () => {

    test('campaign filter defaults to "اختر الحملة" and lists the campaigns', async ({ customersList }) => {
        await expect(customersList.filterTrigger('الحملات')).toContainText('اختر الحملة');
        const options = await customersList.getFilterOptions('الحملات');
        console.log('Campaigns:', options);
        expect(options.length).toBeGreaterThan(0);
    });

    test('filter by a campaign sends its id and shows its name', async ({ customersList }) => {
        // الحملة اللي هنختارها: آخر حملة لعميل موجود في الجدول (لو فيه) – وإلا أول حملة في القائمة
        const loaded: Customer[] = (await Promise.all(customersList.initialResponses.map(customersFrom))).flat();
        const withCampaign = loaded.find((c) => c.last_campaign?.name);
        const campaign = withCampaign?.last_campaign?.name
            ?? (await customersList.getFilterOptions('الحملات'))[0];
        expect(campaign, 'No campaigns to filter by').toBeTruthy();

        const res = await customersList.selectCampaigns([campaign]);
        expect(res.status()).toBe(200);

        const ids = new URL(res.url()).searchParams.getAll('filter[campaign_ids][]');
        console.log(`Campaign "${campaign}" ➜ ids ${JSON.stringify(ids)}`);
        expect(ids).toHaveLength(1);
        if (withCampaign) expect(ids[0]).toBe(String(withCampaign.last_campaign!.id));
        await expect.poll(() => CustomersListPage.decodeUrl(customersList.page.url())).toContain('filter[campaign_ids][]=');
        await expect(customersList.filterTrigger('الحملات')).toContainText(campaign);

        const customers = await customersFrom(res);
        await expect.poll(() => customersList.getRowsCount()).toBe(customers.length);
        await customersList.printTable(`Campaign = ${campaign}`);

        if (withCampaign) {
            // فيه عميل آخر حملة ليه هي دي ➜ النتيجة لازم ما تبقاش فاضية
            expect(customers.length, `Customer #${withCampaign.id} was in campaign "${campaign}"`).toBeGreaterThan(0);
        } else if (customers.length === 0) {
            test.info().annotations.push({ type: 'note', description: `No customers in campaign "${campaign}"` });
        }
    });

    test('filter by two campaigns sends both ids', async ({ customersList }) => {
        const options = [...new Set(await customersList.getFilterOptions('الحملات'))];
        test.skip(options.length < 2, 'Need at least 2 campaigns');
        const picked = options.slice(0, 2);

        const res = await customersList.selectCampaigns(picked);
        expect(res.status()).toBe(200);
        const ids = new URL(res.url()).searchParams.getAll('filter[campaign_ids][]');
        console.log(`Campaigns ${JSON.stringify(picked)} ➜ ids ${JSON.stringify(ids)}`);
        expect(ids).toHaveLength(2);
        expect(new Set(ids).size).toBe(2);
        await customersList.printTable(`Campaigns = ${picked.join(', ')}`);
    });
});
