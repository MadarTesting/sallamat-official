import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { NewItemsTracker, printApiCall } from '../utils/apiLogFormat';

// الصفحات اللي اللوجينج اتفعّل عليها بالفعل (عشان ما يتسجلش مرتين على نفس الصفحة)
const pagesWithLogging = new WeakSet<Page>();

// الصفحات اللي اتسجل عليها handler البوب أب (عشان ما يتسجلش مرتين)
const pagesWithPopupHandler = new WeakSet<Page>();

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
        this.registerPopupHandlers();
    }

    /**
     * بوب أب "ما هو الجديد في سلامات" بيظهر أحيانًا ويقفل الضغط على الصفحة.
     * Playwright بيقفله أوتوماتيك أول ما يظهر قبل أي أكشن.
     */
    private registerPopupHandlers() {
        if (pagesWithPopupHandler.has(this.page)) return;
        pagesWithPopupHandler.add(this.page);

        const whatsNew = this.page.getByRole('dialog', { name: 'ما هو الجديد في سلامات' });
        this.page.addLocatorHandler(whatsNew, async (dialog) => {
            const closeBtn = dialog
                .getByRole('button', { name: /إغلاق|اغلاق|close|تخطي|فهمت|حسنا|حسنًا|تم/i })
                .first();
            if (await closeBtn.isVisible().catch(() => false)) {
                await closeBtn.click();
            } else {
                await this.page.keyboard.press('Escape');
            }
        });
    }

    // ============= API Logging =============
    /**
     * بيطبع كل API call في التيرمنال مرة واحدة بس، بشكل: Payload / Response.
     * - بيطبع بس الـ API calls (JSON) – مش صفحات Next.js (_rsc) ولا الصور والـ css
     * - نفس الـ call لو الموقع بعته مرتين ورا بعض بيتطبع مرة واحدة
     *
     * الافتراضي (newOnly = true) ➜ وضع "الأكشن بس" – بيطبع الداتا اللي التيست عملها، مش كل داتا الصفحة:
     *   - طلبات الأكشن نفسها (POST / PUT / PATCH / DELETE) بالـ Payload والـ Response كاملين
     *   - الملفات اللي بتتحمل (زي قالب الإكسل)
     *   - الـ lists بعد الأكشن ➜ العناصر الجديدة بس (اللي اتعملت في التيست)
     *   - أي request فشل (4xx / 5xx)
     *   - مش بيطبع: داتا تحميل الصفحة (إحصائيات، session، lists قديمة...) ولا طلبات اللوجين
     *
     * newOnly: false ➜ بيطبع كل الـ API calls (زي الفلاتر – محتاجين نشوف النتايج كلها)
     *
     * @param urlFilter اطبع بس الـ URLs اللي بتطابق الـ Regex (مثلًا /campaign/i)
     * @param fullResponse الـ Response كامل من غير قص (الافتراضي = نفس newOnly)
     */
    enableApiLogging(options: { urlFilter?: RegExp; fullResponse?: boolean; newOnly?: boolean } = {}) {
        if (pagesWithLogging.has(this.page)) return;
        pagesWithLogging.add(this.page);
        const { urlFilter, newOnly = true, fullResponse = newOnly } = options;
        const tracker = newOnly ? new NewItemsTracker() : undefined;
        const isApiRequest = (type: string, url: string) => ['xhr', 'fetch'].includes(type) && !url.includes('_rsc=');
        const isAuth = (url: string) => /\/api\/auth\//.test(url);
        const isWrite = (method: string) => !['GET', 'HEAD', 'OPTIONS'].includes(method);

        // وقت الأكشن بيتسجل لحظة ما الـ request يتبعت (قبل أي list تتحمل بعده)
        if (tracker) {
            this.page.on('request', (request) => {
                if (isApiRequest(request.resourceType(), request.url()) && isWrite(request.method()) && !isAuth(request.url())) {
                    tracker.markAction();
                }
            });
        }

        this.page.on('response', async (response) => {
            try {
                const request = response.request();
                const url = request.url();

                if (!isApiRequest(request.resourceType(), url)) return;  // مش API (صفحات Next.js _rsc، صور، css)
                if (urlFilter && !urlFilter.test(url)) return;

                const contentType = response.headers()['content-type'] ?? '';
                const isFile = /spreadsheet|octet-stream|excel|pdf|image|video/.test(contentType);
                if (!isFile && !contentType.includes('json')) return;   // API = JSON بس

                const method = request.method();
                const failed = response.status() >= 400;
                // وضع الأكشن بس: اللوجين وداتا تحميل الصفحة مش بيتطبعوا (إلا لو فشلوا)
                if (tracker && !failed && isAuth(url)) return;

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
                let responseText = isFile ? `<file download – ${contentType}>` : await response.text();
                let resultLine: string | undefined;
                if (tracker && !failed && !isFile && !isWrite(method)) {
                    const filtered = tracker.filter(url, responseText);
                    if (!filtered || filtered.skip) return;   // داتا الصفحة / list مفيهاش جديد
                    responseText = filtered.text;
                    resultLine = filtered.note;
                }
                printApiCall({
                    method,
                    url,
                    status: response.status(),
                    statusText: response.statusText(),
                    timeMs: timing.responseEnd > 0 ? Math.round(timing.responseEnd) : undefined,
                    requestBody,
                    requestContentType,
                    requestNote,
                    responseText,
                    resultLine,
                    resultOk: true,
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
