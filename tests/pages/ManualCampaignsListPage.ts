import type { Page } from '@playwright/test';
import { CampaignsListPage } from './CampaignsListPage';

export type { FilterLabel } from './CampaignsListPage';

/** أعمدة جدول الحملات اليدوية (رقم الـ td – بيبدأ من 1) */
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
 * صفحة قائمة الحملات اليدوية: مربع البحث + الفلاتر
 * (الحالة / القالب / حالة القالب / المجموعة / نطاق التاريخ / الترتيب الزمني) + الجدول.
 * كل المنطق المشترك موجود في CampaignsListPage.
 */
export class ManualCampaignsListPage extends CampaignsListPage {

    static readonly URL = 'https://demo.sallamaat.com/manual-campaigns';

    constructor(page: Page) {
        super(page, {
            url: ManualCampaignsListPage.URL,
            api: '/api/campaign?',
            searchPlaceholder: 'البحث باسم الحملة...',
            nameColumn: COLUMN.name,
        });
    }

    protected tableColumns() {
        return {
            name: COLUMN.name,
            date: COLUMN.sendDate,
            status: COLUMN.status,
            template: COLUMN.template,
            templateStatus: COLUMN.templateStatus,
            group: COLUMN.group,
        };
    }
}
