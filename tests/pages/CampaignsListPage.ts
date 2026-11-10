import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from './BasePage';

/** أسماء الفلاتر زي ما هي مكتوبة فوق كل فلتر في الصفحة */
export type FilterLabel =
    | 'الحالة'
    | 'الحدث'
    | 'القالب'
    | 'حالة القالب'
    | 'المجموعة'
    | 'نطاق التاريخ'
    | 'الترتيب الزمني';

/** إعدادات كل صفحة قائمة حملات (يدوية / تلقائية) */
export type CampaignsListConfig = {
    url: string;               // رابط الصفحة
    api: string;               // جزء من رابط الـ API بتاع القائمة (مثلًا '/api/campaign?')
    searchPlaceholder: string; // placeholder مربع البحث
    nameColumn: number;        // رقم عمود اسم الحملة (td – بيبدأ من 1)
};

/**
 * الأساس المشترك لصفحات قوائم الحملات (اليدوية والتلقائية):
 * مربع البحث + الفلاتر (popover) + نطاق التاريخ + قراءة الجدول.
 * الفلاتر بتتحفظ في الـ URL، فـ open() بيفتح الصفحة نضيفة من غير أي فلتر.
 */
export abstract class CampaignsListPage extends BasePage {

    readonly config: CampaignsListConfig;

    // ============= Locators =============
    readonly searchInput: Locator;
    readonly openPopover: Locator;
    readonly dataRows: Locator;

    /** أول Response للحملات لما الصفحة اتفتحت (الترتيب الافتراضي: من الأحدث للأقدم) */
    initialResponse?: Response;

    constructor(page: Page, config: CampaignsListConfig) {
        super(page);
        this.config = config;
        this.searchInput = page.locator(`input[placeholder='${config.searchPlaceholder}']`);
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
        const loaded = this.waitForListApi();
        await this.page.goto(this.config.url, { waitUntil: 'domcontentloaded' });
        this.initialResponse = await loaded;
        await expect(this.searchInput).toBeVisible({ timeout: 20000 });
    }

    /** بيستنى الـ API بتاع القائمة (اختياري: لازم الـ URL يحتوي على جزء معين) */
    waitForListApi(urlPart?: string): Promise<Response> {
        return this.page.waitForResponse(
            (res) => {
                const url = decodeURIComponent(res.url()).replace(/\+/g, ' ');
                return url.includes(this.config.api) &&
                    (!urlPart || url.includes(urlPart)) &&
                    res.request().method() === 'GET';
            },
            { timeout: 20000 },
        );
    }

    // ============= Search =============

    /** يكتب في مربع البحث ويستنى نتيجة الـ API */
    async search(text: string): Promise<Response> {
        const res = this.waitForListApi(`filter[name]=${text}`);
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
        // بعض الاختيارات (زي الأحداث) بتيجي من API منفصل – نستنى أول اختيار يظهر
        await expect(this.openPopover.locator('span').first()).toBeVisible({ timeout: 15000 });
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

        const res = this.waitForListApi();
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
        const res = this.waitForListApi(`filter[date][to]=${to}`);
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

    async getNames(): Promise<string[]> {
        return this.getColumnValues(this.config.nameColumn);
    }

    /** الأعمدة اللي بتتطبع في printTable – كل صفحة بتحددها */
    protected abstract tableColumns(): Record<string, number>;

    /** يطبع الجدول في التيرمنال */
    async printTable(title: string) {
        const columns = this.tableColumns();
        const rows = await this.dataRows.evaluateAll((trs, cols) =>
            trs.map((tr) => Object.fromEntries(Object.entries(cols).map(([key, i]) =>
                [key, (tr.querySelector(`td:nth-child(${i})`) as HTMLElement | null)?.innerText.trim() ?? '']))),
            columns,
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

/** بيقرا قائمة الحملات من الـ Response (data.data) */
export async function campaignsFrom<T = Record<string, unknown>>(res: Response): Promise<T[]> {
    const body = await res.json();
    return (body?.data?.data ?? body?.data ?? []) as T[];
}
