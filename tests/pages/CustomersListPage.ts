import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from './BasePage';

/** أسماء الفلاتر زي ما هي مكتوبة فوق كل فلتر في صفحة العملاء */
export type CustomersFilterLabel =
    | 'العملاء'
    | 'تاريخ آخر تعديل'
    | 'الحملات'
    | 'النوع'
    | 'الترتيب الزمني';

/**
 * أعمدة جدول العملاء (عنوان العمود زي ما هو في الجدول).
 * الأعمدة بتتغير حسب فلتر "العملاء" (مثلًا "العملاء" بيزوّد أعمدة الطلبات)
 * ➜ بنجيب العمود بالعنوان مش بالرقم.
 */
export const CUSTOMER_COLUMN = {
    name: 'جهات الاتصال',
    phone: 'رقم الهاتف',
    gender: 'النوع',
    campaign: 'الحملة',
    updatedAt: 'تاريخ آخر تعديل',
    email: 'البريد الإلكتروني',
} as const;

export type CustomerColumn = (typeof CUSTOMER_COLUMN)[keyof typeof CUSTOMER_COLUMN];

/** عميل زي ما بيرجع من الـ API */
export type Customer = {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    mobile?: string;
    mobile_code?: string;
    email?: string | null;
    gender?: string | null;
    type?: string;
    updated_at?: string;
    last_campaign?: { id: number; name: string } | null;
};

/**
 * "أنثى" في الفلتر بتظهر "انثي" في الجدول والـ API ➜ بنوحّد الهمزات والياء قبل المقارنة
 */
export const normalizeArabic = (s: string) =>
    s.trim().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

/**
 * صفحة العملاء ➜ تاب "جهات الاتصال": مربع البحث + الفلاتر
 * (العملاء / تاريخ آخر تعديل / الحملات / النوع / الترتيب الزمني) + الجدول.
 * الفلاتر بتتحفظ في الـ URL، فـ open() بيفتح الصفحة نضيفة من غير أي فلتر.
 */
export class CustomersListPage extends BasePage {

    static readonly URL = 'https://demo.sallamaat.com/customers';
    static readonly API = '/api/customers?';

    // ============= Locators =============
    readonly searchInput: Locator;
    readonly openPopover: Locator;
    readonly dataRows: Locator;

    /** الـ Responses اللي اتحملت لما الصفحة اتفتحت (page=1 و page=2) – الترتيب الافتراضي */
    initialResponses: Response[] = [];

    constructor(page: Page) {
        super(page);
        this.searchInput = page.locator("input[placeholder='ابحث باسم العميل أو رقم الهاتف']");
        this.openPopover = page.locator("[data-slot='popover-content'][data-state='open']");
        // صفوف الداتا بس (كل صف فيه checkbox)
        this.dataRows = page.locator('table tbody tr').filter({ has: page.getByRole('checkbox') });
    }

    /** زرار الفلتر (نسخة الديسكتوب – فيه نسخة موبايل accordion مخفية بنتجاهلها) */
    filterTrigger(label: CustomersFilterLabel): Locator {
        return this.page.locator(
            `xpath=//*[(self::p or self::span) and normalize-space(text())='${label}']` +
            `/following-sibling::div[contains(@class,'md:block')]//button[@data-slot='popover-trigger']`
        ).first();
    }

    /** اختيار من جوه البوب أب المفتوح بالنص بالظبط */
    popoverOption(text: string): Locator {
        return this.openPopover.locator(`xpath=.//span[normalize-space()='${text}']/..`).first();
    }

    // ============= Navigation =============

    /** يفتح الصفحة من غير أي فلاتر ويستنى الجدول */
    async open() {
        const collect = (res: Response) => {
            if (this.isListResponse(res)) this.initialResponses.push(res);
        };
        this.page.on('response', collect);
        const loaded = this.waitForListApi();
        await this.page.goto(CustomersListPage.URL, { waitUntil: 'domcontentloaded' });
        await loaded;
        await expect(this.searchInput).toBeVisible({ timeout: 45000 });
        await expect(this.dataRows.first()).toBeVisible({ timeout: 45000 });
        await this.page.waitForLoadState('networkidle').catch(() => {});
        this.page.off('response', collect);
    }

    private isListResponse(res: Response) {
        return res.url().includes(CustomersListPage.API) && res.request().method() === 'GET';
    }

    /** الـ URL بعد فك الـ encoding (+ = مسافة) */
    static decodeUrl(url: string) {
        return decodeURIComponent(url.replace(/\+/g, ' '));
    }

    /** بيستنى الـ API بتاع القائمة (الصفحة الأولى) – اختياري: لازم الـ URL يحتوي على جزء معين */
    waitForListApi(urlPart?: string): Promise<Response> {
        return this.page.waitForResponse(
            (res) => {
                if (!this.isListResponse(res)) return false;
                const url = CustomersListPage.decodeUrl(res.url());
                return /[?&]page=1(&|$)/.test(url) && (!urlPart || url.includes(urlPart));
            },
            { timeout: 30000 },
        );
    }

    // ============= Search =============

    /** يكتب في مربع البحث ويستنى نتيجة الـ API */
    async search(text: string): Promise<Response> {
        const res = this.waitForListApi(`filter[search]=${text}`);
        await this.searchInput.fill(text);
        const response = await res;
        console.log(`🔎 Search "${text}" ➜ ${response.status()}`);
        return response;
    }

    /** يمسح البحث (الصفحة ممكن ترجع الداتا المتخزنة من غير request جديد) */
    async clearSearch() {
        await this.searchInput.fill('');
        await expect(this.searchInput).toHaveValue('');
    }

    // ============= Filters =============

    async openFilter(label: CustomersFilterLabel) {
        const trigger = this.filterTrigger(label);
        await expect(trigger).toBeVisible({ timeout: 15000 });
        await trigger.click();
        await expect(this.openPopover).toBeVisible({ timeout: 10000 });
    }

    async closeFilter() {
        if (await this.openPopover.count() === 0) return;
        await this.page.keyboard.press('Escape');
        await expect(this.openPopover).toBeHidden({ timeout: 5000 });
    }

    /** يرجّع كل الاختيارات اللي في الفلتر */
    async getFilterOptions(label: CustomersFilterLabel): Promise<string[]> {
        await this.openFilter(label);
        // الحملات بتيجي من API منفصل ("جاري التحميل...") – نستنى أول اختيار يظهر
        await expect(this.openPopover.locator('span').first()).toBeVisible({ timeout: 30000 });
        const options = (await this.openPopover.locator('span').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
        await this.closeFilter();
        return options;
    }

    /** فلتر بيختار اختيار واحد (العملاء / النوع / الترتيب الزمني) ويستنى الـ API */
    async selectFilter(label: CustomersFilterLabel, option: string, urlPart?: string): Promise<Response> {
        await this.openFilter(label);
        const res = this.waitForListApi(urlPart);
        await this.popoverOption(option).click();
        const response = await res;
        await this.closeFilter();

        console.log(`🧩 Filter [${label}] = "${option}" ➜ ${response.status()}`);
        return response;
    }

    /** فلتر "الحملات": بيدوّر على الحملة ويعلّم عليها ➜ حفظ */
    async selectCampaigns(names: string[]): Promise<Response> {
        await this.openFilter('الحملات');
        const innerSearch = this.openPopover.locator("input[placeholder='ابحث عن حملة']");
        for (const name of names) {
            await innerSearch.fill(name);
            const option = this.openPopover.locator(
                `xpath=.//span[normalize-space()='${name}']/following-sibling::button[@role='checkbox']`
            ).first();
            await expect(option).toBeVisible({ timeout: 30000 });
            await option.click();
            await expect(option).toHaveAttribute('data-state', 'checked');
        }
        const res = this.waitForListApi('filter[campaign_ids]');
        await this.openPopover.getByRole('button', { name: 'حفظ' }).click();
        const response = await res;
        await this.closeFilter();

        console.log(`🧩 Filter [الحملات] = ${JSON.stringify(names)} ➜ ${response.status()}`);
        return response;
    }

    /** تاريخ آخر تعديل: بيضغط على يوم البداية ويوم النهاية (YYYY-MM-DD) في الكاليندر */
    async selectDateRange(from: string, to: string): Promise<Response> {
        await this.openFilter('تاريخ آخر تعديل');
        await this.openPopover.locator(`td[data-day='${from}'] button`).click();
        const res = this.waitForListApi(`filter[updated_at][to]=${to}`);
        await this.openPopover.locator(`td[data-day='${to}'] button`).click();
        const response = await res;
        await this.closeFilter();
        console.log(`📅 Date range ${from} ➜ ${to}`);
        return response;
    }

    // ============= Table =============

    async getRowsCount(): Promise<number> {
        return this.dataRows.count();
    }

    /** رقم العمود (td – بيبدأ من 1) من عنوانه في الـ thead */
    async columnIndex(header: CustomerColumn): Promise<number> {
        const headers = (await this.page.locator('table thead th').allInnerTexts()).map((h) => h.trim());
        const i = headers.indexOf(header);
        expect(i, `Column "${header}" not found in [${headers.join(' | ')}]`).toBeGreaterThanOrEqual(0);
        return i + 1;
    }

    async getColumnValues(header: CustomerColumn): Promise<string[]> {
        if (await this.dataRows.count() === 0) return [];
        const column = await this.columnIndex(header);
        const values = await this.dataRows.locator(`td:nth-child(${column})`).allInnerTexts();
        return values.map((v) => v.trim());
    }

    /** يطبع الجدول في التيرمنال */
    async printTable(title: string) {
        const headers = (await this.page.locator('table thead th').allInnerTexts()).map((h) => h.trim());
        const rows = await this.dataRows.evaluateAll((trs, hs) =>
            trs.map((tr) => Object.fromEntries(hs.map((h, i) => [h, (tr.children[i] as HTMLElement | undefined)?.innerText.trim() ?? ''])
                .filter(([h]) => h))),
            headers,
        );
        console.log(`\n📋 ${title} – ${rows.length} row(s)`);
        if (rows.length) console.table(rows);
    }
}

/** بيقرا قائمة العملاء من الـ Response (data.data) */
export async function customersFrom(res: Response): Promise<Customer[]> {
    const body = await res.json();
    return (body?.data?.data ?? body?.data ?? []) as Customer[];
}
