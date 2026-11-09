import { test, type APIResponse } from '@playwright/test';
import type { Verdict } from './authResult';

const COLOR = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

// لعرض القيم الحقيقية محلياً: $env:SHOW_SECRETS="1"
const SENSITIVE_KEYS = ['password', 'csrftoken', 'token', 'access_token', 'refresh_token'];
const SHOW_SECRETS = process.env.SHOW_SECRETS === '1';

function maskObject(value: unknown): unknown {
    if (SHOW_SECRETS || value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(maskObject);
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) =>
            SENSITIVE_KEYS.includes(k.toLowerCase()) ? [k, '********'] : [k, maskObject(v)],
        ),
    );
}

function statusColor(status: number): string {
    if (status >= 500) return COLOR.red;
    if (status >= 400) return COLOR.yellow;
    if (status >= 300) return COLOR.cyan;
    return COLOR.green;
}

function formatSize(bytes: number): string {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(2)} KB`;
}

function prettyBody(text: string): string {
    if (!text) return '(empty body)';
    try {
        return JSON.stringify(maskObject(JSON.parse(text)), null, 2);
    } catch {
        return text.length > 2000 ? text.slice(0, 2000) + '\n... (truncated)' : text;
    }
}

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

    const effective = verdict && !verdict.ok ? verdict.status : httpStatus;
    const shownStatus =
        effective !== httpStatus
            ? `Status: ${effective} (server sent ${httpStatus} ${res.statusText()})`
            : `Status: ${httpStatus} ${res.statusText()}`;
    const statusLine = `${shownStatus}   Time: ${elapsed} ms   Size: ${formatSize(Buffer.byteLength(text))}`;

    const resultPlain = verdict
        ? `Result: ${verdict.ok ? '✅ SUCCESS' : '❌ FAILED'} - ${verdict.reason}`
        : '';

    const headers = res
        .headersArray()
        .map(({ name, value }) =>
            name.toLowerCase() === 'set-cookie' && !SHOW_SECRETS
                ? `  ${name}: ${value.replace(/^([^=]+)=([^;]*)/, '$1=********')}`
                : `  ${name}: ${value}`,
        )
        .join('\n');

    const lines = [
        `━━━━━━━━━━ ${label} ━━━━━━━━━━`,
        `${method} ${url}`,
        requestBody ? `\nRequest Body:\n${JSON.stringify(maskObject(requestBody), null, 2)}` : '',
        `\n@@STATUS@@`,
        verdict ? `@@RESULT@@` : '',
        `\nResponse Headers:\n${headers}`,
        `\nResponse Body:\n${prettyBody(text)}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ].filter(Boolean);

    const joined = lines.join('\n');
    const plain = joined.replace('@@STATUS@@', statusLine).replace('@@RESULT@@', resultPlain);
    const colored = joined
        .replace('@@STATUS@@', `${COLOR.bold}${statusColor(effective)}${statusLine}${COLOR.reset}`)
        .replace(
            '@@RESULT@@',
            `${COLOR.bold}${verdict?.ok ? COLOR.green : COLOR.red}${resultPlain}${COLOR.reset}`,
        );

    console.log('\n' + colored + '\n');
    await test.info().attach(label, { body: plain, contentType: 'text/plain' });

    return res;
}