import { test, type APIResponse } from '@playwright/test';
import type { Verdict } from './authResult';
import { formatApiCall } from './apiLogFormat';

/**
 * للـ API tests (request context): بيبعت الـ request ويطبعه في التيرمنال
 * بنفس شكل الـ UI tests (Payload / Preview / Response) ويضيفه للريبورت.
 */
export async function sendAndLog(
    label: string,
    method: string,
    url: string,
    requestBody: Record<string, unknown> | undefined,
    send: () => Promise<APIResponse>,
    interpret?: (httpStatus: number, text: string) => Verdict,
): Promise<APIResponse> {
    const start = Date.now();
    const res = await send();
    const elapsed = Date.now() - start;

    const text = await res.text();
    const httpStatus = res.status();
    const verdict = interpret?.(httpStatus, text);

    // لو الـ server رجّع 200 بس النتيجة فشل (زي next-auth) بنعرض الـ status الحقيقي
    const effective = verdict && !verdict.ok ? verdict.status : httpStatus;

    const out = formatApiCall(
        {
            label,
            method,
            url,
            status: effective,
            statusText: effective !== httpStatus ? `(server sent ${httpStatus})` : res.statusText(),
            timeMs: elapsed,
            requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
            requestContentType: 'application/json',
            responseText: text,
            resultLine: verdict ? `Result: ${verdict.ok ? '✅ SUCCESS' : '❌ FAILED'} – ${verdict.reason}` : undefined,
            resultOk: verdict?.ok,
        },
        { dedupe: false }, // كل تيست API بيطبع الـ call بتاعه
    );

    if (out) {
        console.log('\n' + out.colored + '\n');
        await test.info().attach(label, { body: out.plain, contentType: 'text/plain' });
    }
    return res;
}
