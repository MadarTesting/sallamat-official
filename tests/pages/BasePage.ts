import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { printApiCall } from '../utils/apiLogFormat';

// الصفحات اللي اللوجينج اتفعّل عليها بالفعل (عشان ما يتسجلش مرتين على نفس الصفحة)
const pagesWithLogging = new WeakSet<Page>();

// آخر ملفات اترفعت من كل صفحة – Chromium مش بيدّي محتوى الـ request لما يكون فيه ملف،
// فبنعرض في الـ Payload اسم الملف وحجمه من هنا
const uploadedFiles = new WeakMap<Page, string[]>();

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
    enableApiLogging(options: { urlFilter?: RegExp; fullResponse?: boolean } = {}) {
        if (pagesWithLogging.has(this.page)) return;
        pagesWithLogging.add(this.page);
        const { urlFilter, fullResponse } = options;

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
                const headers = await request.allHeaders();
                const requestContentType = headers['content-type'] ?? '';
                let requestBody = request.postData();
                let requestNote: string | undefined;
                if (requestContentType.includes('multipart/form-data')) {
                    // رفع ملف: Chromium مش بيدّي الـ body ➜ نعرض الملفات اللي الـ Page Object رفعها
                    requestBody = request.postDataBuffer()?.toString('latin1') ?? null;
                    if (!requestBody) {
                        const files = uploadedFiles.get(this.page) ?? [];
                        requestNote = [
                            `multipart/form-data · ${headers['content-length'] ?? '?'} bytes`,
                            ...files.map((f) => {
                                const kb = fs.existsSync(f) ? (fs.statSync(f).size / 1024).toFixed(1) : '?';
                                return `file: 📎 ${path.basename(f)} (${kb} KB)`;
                            }),
                        ].join('\n');
                    }
                }
                printApiCall({
                    method: request.method(),
                    url,
                    status: response.status(),
                    statusText: response.statusText(),
                    timeMs: timing.responseEnd > 0 ? Math.round(timing.responseEnd) : undefined,
                    requestBody,
                    requestContentType,
                    requestNote,
                    responseText: isFile ? `<file download – ${contentType}>` : await response.text(),
                    fullResponse,
                });
            } catch {
                // لو الصفحة اتقفلت أثناء القراءة نتجاهل الخطأ
            }
        });
    }

    /** الـ Page Objects بتنادي دي بعد ما ترفع ملف، عشان يظهر في الـ Payload بتاع الـ upload */
    protected rememberUpload(filePath: string) {
        uploadedFiles.set(this.page, [filePath]);
    }
}
