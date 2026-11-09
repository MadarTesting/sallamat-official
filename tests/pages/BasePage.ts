import type { Page } from '@playwright/test';
import { printApiCall } from '../utils/apiLogFormat';

// الصفحات اللي اللوجينج اتفعّل عليها بالفعل (عشان ما يتسجلش مرتين على نفس الصفحة)
const pagesWithLogging = new WeakSet<Page>();

/**
 * BasePage – كل الـ Page Objects بتورث منه.
 * فيه الحاجات المشتركة: الـ page + طباعة الـ APIs في التيرمنال.
 */
export abstract class BasePage {

    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ============= API Logging =============
    /**
     * بيطبع كل API call في التيرمنال مرة واحدة بس، بشكل: Payload / Preview / Response.
     * - بيطبع بس الـ API calls (JSON) – مش صفحات Next.js (_rsc) ولا الصور والـ css
     * - نفس الـ call لو الموقع بعته مرتين ورا بعض بيتطبع مرة واحدة
     *
     * @param urlFilter اطبع بس الـ URLs اللي بتطابق الـ Regex (مثلًا /campaign/i)
     */
    enableApiLogging(options: { urlFilter?: RegExp } = {}) {
        if (pagesWithLogging.has(this.page)) return;
        pagesWithLogging.add(this.page);
        const { urlFilter } = options;

        this.page.on('response', async (response) => {
            try {
                const request = response.request();
                const url = request.url();

                if (!['xhr', 'fetch'].includes(request.resourceType())) return;
                if (url.includes('_rsc=')) return;                      // تنقلات Next.js مش API
                if (urlFilter && !urlFilter.test(url)) return;

                const contentType = response.headers()['content-type'] ?? '';
                const isFile = /spreadsheet|octet-stream|excel|pdf|image|video/.test(contentType);
                if (!isFile && !contentType.includes('json')) return;   // API = JSON بس

                await response.finished();          // عشان الوقت (responseEnd) يبقى متحسب
                const timing = request.timing();
                printApiCall({
                    method: request.method(),
                    url,
                    status: response.status(),
                    statusText: response.statusText(),
                    timeMs: timing.responseEnd > 0 ? Math.round(timing.responseEnd) : undefined,
                    requestBody: request.postData(),
                    requestContentType: request.headers()['content-type'] ?? '',
                    responseText: isFile ? `<file download – ${contentType}>` : await response.text(),
                });
            } catch {
                // لو الصفحة اتقفلت أثناء القراءة نتجاهل الخطأ
            }
        });
    }
}
