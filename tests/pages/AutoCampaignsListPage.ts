import type { Page } from '@playwright/test';
import { CampaignsListPage } from './CampaignsListPage';

/** أعمدة جدول الحملات التلقائية (رقم الـ td – بيبدأ من 1) */
export const AUTO_COLUMN = {
    serial: 2,          // الرقم التسلسلي
    name: 3,            // اسم الحملة
    status: 4,          // الحالة (زرار تشغيل / إيقاف)
    customersCount: 5,  // عدد العملاء
    event: 6,           // الحدث
    template: 7,        // القالب
    templateStatus: 8,  // حالة القالب
    createdAt: 9,       // تاريخ الإنشاء
} as const;

/**
 * فلتر "الحالة" ➜ قيمة status في الـ API + نص الزرار اللي بيظهر في عمود الحالة.
 * الحملة المفعّلة بيظهر عليها "إيقاف" (عشان توقفها)، والباقي "تشغيل".
 */
export const AUTO_STATUS = {
    'مفعلة': { api: 'active', button: 'إيقاف' },
    'غير مفعلة': { api: 'inactive', button: 'تشغيل' },
    'متوقفة': { api: 'stopped', button: 'تشغيل' },
} as const;
export type AutoStatus = keyof typeof AUTO_STATUS;

/** اختيارات فلتر "حالة القالب" (لاحظ: "متوقف مؤقتاً" بالتنوين هنا – في اليدوية من غير تنوين) */
export const AUTO_TEMPLATE_STATUSES = ['معتمد', 'قيد الانتظار', 'مرفوض', 'متوقف مؤقتاً', 'معطل'] as const;

/** اختيارات فلتر "الحدث" */
export const AUTO_EVENTS = ['تم إنشاء عميل', 'إنشاء سلة مشتريات متروكة', 'تم إنشاء طلب', 'تحديث حالة الطلب'] as const;

/** شكل الحملة في الـ Response */
export type AutoCampaign = {
    id: number;
    name: string;
    status: string;          // active | inactive | stopped
    is_active: boolean;
    event_name: string;
    template_name: string;
    template_status: string; // APPROVED | ...
    created_at: string;
};

/**
 * صفحة قائمة الحملات التلقائية: مربع البحث + الفلاتر
 * (الحالة / الحدث / حالة القالب / نطاق التاريخ / الترتيب الزمني) + الجدول.
 * كل المنطق المشترك موجود في CampaignsListPage.
 */
export class AutoCampaignsListPage extends CampaignsListPage {

    static readonly URL = 'https://demo.sallamaat.com/automated-campaigns';

    constructor(page: Page) {
        super(page, {
            url: AutoCampaignsListPage.URL,
            api: '/api/automated-campaigns?',
            searchPlaceholder: 'ابحث باسم الحملة ...',
            nameColumn: AUTO_COLUMN.name,
        });
    }

    protected tableColumns() {
        return {
            name: AUTO_COLUMN.name,
            status: AUTO_COLUMN.status,
            event: AUTO_COLUMN.event,
            template: AUTO_COLUMN.template,
            templateStatus: AUTO_COLUMN.templateStatus,
            createdAt: AUTO_COLUMN.createdAt,
        };
    }
}
