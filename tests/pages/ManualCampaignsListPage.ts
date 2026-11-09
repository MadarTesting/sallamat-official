import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from './BasePage';

/** أسماء الفلاتر زي ما هي مكتوبة فوق كل فلتر في الصفحة */
export type FilterLabel =
    | 'الحالة'
    | 'القالب'
    | 'حالة القالب'
    | 'المجموعة'
    | 'نطاق التاريخ'
    | 'الترتيب الزمني';

/** أعمدة جدول الحملات (رقم الـ td – بيبدأ من 1) */
export const COLUMN = {
    name: 2,            // اسم الحملة
    sendDate: 3,        // تاريخ الإرسال
    customersCount: 4,  // عدد العملاء
    status: 5,          // الحالة
    statusAction: 6,    // إجراء الحالة
    template: 7,        // القالب
    templateStatus: 8,  // حالة القالب
    group: 9,           // المجموعة
} as const;

/**
 * صفحة قائمة الحملات اليدوية: مربع البحث + الفلاتر + الجدول.
 * الفلاتر بتتحفظ في الـ URL، فـ open() بيفتح الصفحة نضيفة من غير أي فلتر.
 */
export class ManualCampaignsListPage extends BasePage {

    static readonly URL = 'https://demo.sallamaat.com/manual-campaigns';
    static readonly CAMPAIGNS_API = '/api/campaign?';

    // ============= Locators =============
    readonly searchInput: Locator;
    readonly openPopover: Locator;
    readonly dataRows: Locator;

    /** أول Response للحملات لما الصفحة اتفتحت (الترتيب الافتراضي: من الأحدث للأقدم) */
    initialResponse?: Response;

    constructor(page: Page) {
        super(page);
        this.searchInput = page.locator("input[placeholder='البحث باسم الحملة...']");
        this.openPopover = page.locator("[data-slot='popover-content'][data-state='open']");
        // صفوف الداتا بس (كل صف فيه checkbox)
        this.dataRows = page.locator('table tbody tr').filter({ has: page.getByRole('checkbox') });
    }

    /** زرار الفلتر (نسخة الديسكتوب – فيه نسخة موبايل مخفية بنتجاهلها) */
    filterTrigger(label: FilterLabel): Locator {
        return this.page.locator(
            `xpath=//*[(self::p or self::span) and normalize-space(text())='${label}' and contains(@class,'md:block')]` +
            `/following-sibling::div[not(contains(@class,'md:hidden'))]//button[@data-slot='popover-trigger']`
        ).first();
    }

    /** اختيار من جوه البوب أب المفتوح بالنص بالظبط */
    popoverOption(text: string): Locator {
        return this.openPopover.locator(`xpath=.//span[normalize-space()='${text}']/..`).first();
    }

    // ============= Navigation =============

    /** يفتح الصفحة من غير أي فلاتر ويستنى الجدول */
    async open() {
        const loaded = this.waitForCampaignsApi();
        await this.page.goto(ManualCampaignsListPage.URL, { waitUntil: 'domcontentloaded' });
        this.initialResponse = await loaded;
        await expect(this.searchInput).toBeVisible({ timeout: 20000 });
    }

    /** بيستنى الـ API بتاع الحملات (اختياري: لازم الـ URL يحتوي على جزء معين) */
    waitForCampaignsApi(urlPart?: string): Promise<Response> {
        return this.page.waitForResponse(
            (res) => {
                const url = decodeURIComponent(res.url()).replace(/\+/g, ' ');
                return url.includes(ManualCampaignsListPage.CAMPAIGNS_API) &&
                    (!urlPart || url.includes(urlPart)) &&
                    res.request().method() === 'GET';
            },
            { timeout: 20000 },
        );
    }

    // ============= Search =============

    /** يكتب في مربع البحث ويستنى نتيجة الـ API */
    async search(text: string): Promise<Response> {
        const res = this.waitForCampaignsApi(`filter[name]=${text}`);
        await this.searchInput.fill(text);
        const response = await res;
        console.log(`🔎 Search "${text}" ➜ ${response.status()}`);
        return response;
    }

    async clearSearch() {
        await this.searchInput.fill('');
    }

    // ============= Filters =============

    async openFilter(label: FilterLabel) {
        const trigger = this.filterTrigger(label);
        await expect(trigger).toBeVisible({ timeout: 15000 });
        await trigger.click();
        await expect(this.openPopover).toBeVisible({ timeout: 10000 });
    }

    async closeFilter() {
        await this.page.keyboard.press('Escape');
        await expect(this.openPopover).toBeHidden({ timeout: 5000 });
    }

    /** يرجّع كل الاختيارات اللي في الفلتر */
    async getFilterOptions(label: FilterLabel): Promise<string[]> {
        await this.openFilter(label);
        const options = (await this.openPopover.locator('span').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
        await this.closeFilter();
        return options;
    }

    /**
     * يختار اختيار من فلتر ويستنى الـ API.
     * الفلاتر اللي فيها مربع بحث (القالب / المجموعة) بنكتب فيه الأول.
     */
    async selectFilter(label: FilterLabel, option: string): Promise<Response> {
        await this.openFilter(label);

        const innerSearch = this.openPopover.locator('input');
        if (await innerSearch.count()) await innerSearch.fill(option);

        const res = this.waitForCampaignsApi();
        await this.popoverOption(option).click();
        const response = await res;
        await this.closeFilter();

        console.log(`🧩 Filter [${label}] = "${option}" ➜ ${decodeURIComponent(response.url())}`);
        return response;
    }

    /** نطاق التاريخ: بيضغط على يوم البداية ويوم النهاية (YYYY-MM-DD) في الكاليندر */
    async selectDateRange(from: string, to: string): Promise<Response> {
        await this.openFilter('نطاق التاريخ');
        await this.openPopover.locator(`td[data-day='${from}'] button`).click();
        const res = this.waitForCampaignsApi(`filter[date][to]=${to}`);
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

    async getColumnValues(column: number): Promise<string[]> {
        const values = await this.dataRows.locator(`td:nth-child(${column})`).allInnerTexts();
        return values.map((v) => v.trim());
    }

    /** يطبع الجدول في التيرمنال (اسم / تاريخ / حالة / قالب / حالة القالب / مجموعة) */
    async printTable(title: string) {
        const rows = await this.dataRows.evaluateAll((trs) =>
            trs.map((tr) => {
                const td = (i: number) => (tr.querySelector(`td:nth-child(${i})`) as HTMLElement | null)?.innerText.trim() ?? '';
                return { name: td(2), date: td(3), status: td(5), template: td(7), templateStatus: td(8), group: td(9) };
            }),
        );
        console.log(`\n📋 ${title} – ${rows.length} row(s)`);
        if (rows.length) console.table(rows);
    }

    // ============= Assertions =============

    /** كل صف في العمود ده لازم قيمته = expected (لو الجدول فاضي بنرجّع false) */
    async expectAllRows(column: number, expected: string): Promise<boolean> {
        const values = await this.getColumnValues(column);
        if (values.length === 0) return false;
        for (const [i, v] of values.entries()) {
            expect(v, `Row ${i + 1}: expected "${expected}" but got "${v}"`).toBe(expected);
        }
        return true;
    }
}
