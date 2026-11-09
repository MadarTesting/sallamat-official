import type { Page } from '@playwright/test';

/**
 * BasePage – كل الـ Page Objects بتورث منه.
 * فيه الحاجات المشتركة: الـ page + طباعة الـ APIs في التيرمنال (Postman-style).
 */
export abstract class BasePage {

    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ============= API Logging (Postman-like) =============
    /**
     * بيطبع في التيرمنال كل API call (xhr/fetch):
     * Method + URL + Status + Time + Request Headers/Body + Response Body.
     * التوكن والكوكيز بيتخفوا، والملفات (رفع/تنزيل) بيتطبع ملخصها بس.
     *
     * @param urlFilter     اطبع بس الـ URLs اللي بتطابق الـ Regex (مثلًا /campaign/i)
     * @param maxBodyLength أقصى طول للـ Response Body قبل ما يتقص
     */
    enableApiLogging(options: { urlFilter?: RegExp; maxBodyLength?: number } = {}) {
        const { urlFilter, maxBodyLength = 3000 } = options;

        this.page.on('response', async (response) => {
            try {
                const request = response.request();
                const type = request.resourceType();

                // نطبع بس الـ API calls (مش الصور والـ css والـ js)
                if (type !== 'xhr' && type !== 'fetch') return;
                if (urlFilter && !urlFilter.test(request.url())) return;

                const status = response.status();
                const icon = status >= 400 ? '❌' : '✅';
                const timing = request.timing();
                const time = timing.responseEnd > 0 ? `${Math.round(timing.responseEnd)} ms` : '-';

                // Request body (لو multipart – رفع ملف – نطبع ملخص بس)
                const contentType = request.headers()['content-type'] ?? '';
                let reqBody = '';
                if (contentType.includes('multipart/form-data')) {
                    reqBody = `<multipart/form-data – ${request.postDataBuffer()?.length ?? 0} bytes (file upload)>`;
                } else {
                    reqBody = request.postData() ?? '';
                    try { reqBody = JSON.stringify(JSON.parse(reqBody), null, 2); } catch { /* not JSON */ }
                }

                // Response body (لو ملف – تنزيل – نطبع نوعه بس)
                const resType = response.headers()['content-type'] ?? '';
                let resBody = '';
                if (/spreadsheet|octet-stream|excel/.test(resType)) {
                    resBody = `<binary file – ${resType}>`;
                } else {
                    try {
                        resBody = JSON.stringify(await response.json(), null, 2);
                    } catch {
                        try { resBody = await response.text(); }
                        catch { resBody = '<no body>'; }
                    }
                }
                if (resBody.length > maxBodyLength)
                    resBody = resBody.slice(0, maxBodyLength) + '\n... (truncated)';

                // إخفاء التوكن والكوكيز
                const headers = { ...request.headers() };
                if (headers['authorization']) headers['authorization'] = '***';
                if (headers['cookie']) headers['cookie'] = '***';

                console.log(
                    [
                        '',
                        '='.repeat(80),
                        `${icon}  ${request.method()}  ${request.url()}`,
                        `Status : ${status} ${response.statusText()}   Time: ${time}`,
                        '--- Request Headers ---',
                        JSON.stringify(headers, null, 2),
                        reqBody ? `--- Request Body ---\n${reqBody}` : '',
                        '--- Response Body ---',
                        resBody,
                        '='.repeat(80),
                    ]
                        .filter(Boolean)
                        .join('\n')
                );
            } catch {
                // لو الصفحة اتقفلت أثناء القراءة نتجاهل الخطأ
            }
        });
    }
}
