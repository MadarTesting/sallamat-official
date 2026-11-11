/**
 * طباعة الـ API calls في التيرمنال بشكل مختصر زي تابات الـ DevTools:
 *
 *   ━━━ ✅ GET 200 OK · 312 ms ━━━
 *   https://api.demo.sallamaat.com/api/campaign?...
 *   ▸ Payload   ➜ الـ query params أو الـ request body
 *   ▸ Preview   ➜ ملخص سريع للـ response (المفاتيح + عدد العناصر)
 *   ▸ Response  ➜ الـ JSON نفسه (بيتقص لو طويل)
 *
 * - مفيش headers (كانت أغلب الكلام)
 * - نفس الـ call لو اتكرر ورا بعض (نفس الـ URL والـ status والـ body) بيتطبع مرة واحدة بس
 * - الباسوورد والتوكن بيتخفوا (SHOW_SECRETS=1 لعرضهم)
 * - طول الـ Response: API_LOG_BODY=3000 (الافتراضي 1200)
 */

const COLOR = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

const SENSITIVE_KEYS = ['password', 'csrftoken', 'token', 'access_token', 'refresh_token', 'authorization'];
const SHOW_SECRETS = process.env.SHOW_SECRETS === '1';
const MAX_RESPONSE = Number(process.env.API_LOG_BODY) || 1200;
const DEDUPE_WINDOW_MS = 5000;

// ============= Helpers =============

export function maskSecrets(value: unknown): unknown {
    if (SHOW_SECRETS || value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(maskSecrets);
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) =>
            SENSITIVE_KEYS.includes(k.toLowerCase()) ? [k, '********'] : [k, maskSecrets(v)],
        ),
    );
}

function tryParseJson(text: string): unknown {
    try { return JSON.parse(text); } catch { return undefined; }
}

function statusColor(status: number): string {
    if (status >= 500) return COLOR.red;
    if (status >= 400) return COLOR.yellow;
    if (status >= 300) return COLOR.cyan;
    return COLOR.green;
}

function indent(text: string, spaces = 2): string {
    const pad = ' '.repeat(spaces);
    return text.split('\n').map((l) => pad + l).join('\n');
}

function short(value: unknown, max = 60): string {
    const s = typeof value === 'string' ? `"${value}"` : String(value);
    return s.length > max ? s.slice(0, max) + '…' : s;
}

// ============= Payload =============

/** الـ Payload: الـ query params (GET) و/أو الـ request body */
export function buildPayload(url: string, body?: string | null, contentType = '', note?: string): string {
    const lines: string[] = [];
    if (note) lines.push(note);

    const params = new URL(url, 'http://localhost').searchParams;
    const query: Record<string, string | string[]> = {};
    params.forEach((v, k) => {
        const prev = query[k];
        query[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
    });
    if (Object.keys(query).length) {
        for (const [k, v] of Object.entries(query)) lines.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
    }

    if (body) {
        if (contentType.includes('multipart/form-data')) {
            lines.push(...describeMultipart(body));
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // زي فورم اللوجين: email=...&password=... ➜ سطر لكل حقل والباسوورد متخفي
            new URLSearchParams(body).forEach((v, k) => {
                const hidden = !SHOW_SECRETS && SENSITIVE_KEYS.includes(k.toLowerCase());
                lines.push(`${k}: ${hidden ? '********' : v}`);
            });
        } else {
            const json = tryParseJson(body);
            lines.push(json !== undefined ? JSON.stringify(maskSecrets(json), null, 2) : body.slice(0, 500));
        }
    }

    return lines.length ? lines.join('\n') : '(none)';
}

/**
 * الـ multipart (رفع ملف): سطر لكل حقل – الملفات بالاسم والنوع والحجم، والحقول العادية بقيمتها.
 * الـ body جاي latin1 (بايتات خام) عشان الملف نفسه، فبنرجّع أسامي الملفات لـ UTF-8 (عربي).
 */
function describeMultipart(raw: string): string[] {
    const lines: string[] = [];
    const parts = raw.split(/\r\n--[^\r\n]*/).map((p) => p.replace(/^--[^\r\n]*\r\n/, ''));
    for (const part of parts) {
        const sep = part.indexOf('\r\n\r\n');
        if (sep === -1) continue;
        const head = part.slice(0, sep);
        const name = /name="([^"]*)"/.exec(head)?.[1];
        if (name === undefined) continue;
        const content = part.slice(sep + 4);
        const filename = /filename="([^"]*)"/.exec(head)?.[1];
        if (filename !== undefined) {
            const type = /Content-Type:\s*([^\r\n]+)/i.exec(head)?.[1] ?? 'unknown';
            const kb = (content.length / 1024).toFixed(1);
            lines.push(`${name}: 📎 ${Buffer.from(filename, 'latin1').toString('utf8')} (${type}, ${kb} KB)`);
        } else {
            const value = Buffer.from(content, 'latin1').toString('utf8');
            const hidden = !SHOW_SECRETS && SENSITIVE_KEYS.includes(name.toLowerCase());
            lines.push(`${name}: ${hidden ? '********' : value.slice(0, 200)}`);
        }
    }
    return lines.length ? lines : [`<multipart – ${raw.length} bytes>`];
}

// ============= Preview =============

function describe(value: unknown): string {
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        return `{ ${keys.slice(0, 6).join(', ')}${keys.length > 6 ? ', …' : ''} }`;
    }
    return short(value);
}

/** الـ Preview: ملخص – كل مفتاح ونوعه/قيمته، ولو فيه List بنعرض أول عنصر مختصر */
export function buildPreview(json: unknown): string {
    if (json === undefined) return '(not JSON)';
    if (Array.isArray(json)) {
        return [`Array(${json.length})`, json.length ? `[0]: ${describe(json[0])}` : ''].filter(Boolean).join('\n');
    }
    if (!json || typeof json !== 'object') return short(json, 200);

    const lines: string[] = [];
    for (const [key, value] of Object.entries(maskSecrets(json) as Record<string, unknown>)) {
        lines.push(`${key}: ${describe(value)}`);
        // مستوى واحد جوه (زي data: { data: [...], total: 103 })
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            for (const [k2, v2] of Object.entries(value as Record<string, unknown>).slice(0, 8)) {
                lines.push(`  ${k2}: ${describe(v2)}`);
            }
        }
        if (Array.isArray(value) && value.length) lines.push(`  [0]: ${describe(value[0])}`);
    }
    return lines.join('\n');
}

// ============= Response =============

export function buildResponse(text: string, max = MAX_RESPONSE): string {
    if (!text) return '(empty)';
    const json = tryParseJson(text);
    const pretty = json !== undefined ? JSON.stringify(maskSecrets(json), null, 2) : text;
    return pretty.length > max
        ? pretty.slice(0, max) + `\n… (truncated – ${pretty.length} chars, set API_LOG_BODY to see more)`
        : pretty;
}

// ============= Print once =============

const recentlyPrinted = new Map<string, number>();

/** true لو نفس الـ call اتطبع في آخر 5 ثواني (الموقع بيبعت نفس الـ request مرتين) */
function isDuplicate(key: string): boolean {
    const now = Date.now();
    for (const [k, t] of recentlyPrinted) if (now - t > DEDUPE_WINDOW_MS) recentlyPrinted.delete(k);
    if (recentlyPrinted.has(key)) return true;
    recentlyPrinted.set(key, now);
    return false;
}

export type ApiCall = {
    label?: string;          // اسم اختياري فوق الـ call (للـ API tests)
    method: string;
    url: string;
    status: number;
    statusText?: string;
    timeMs?: number;
    requestBody?: string | null;
    requestContentType?: string;
    requestNote?: string;    // سطر/سطور زيادة في الـ Payload (مثلًا الملف اللي اترفع)
    responseText: string;
    resultLine?: string;     // سطر نتيجة إضافي (مثلًا ✅ SUCCESS – ...)
    resultOk?: boolean;
    fullResponse?: boolean;  // true ➜ الـ Response كامل من غير قص
};

// ============= New items only =============

/** بيدور على أول List من الـ objects اللي ليها id جوه الـ JSON (زي data.data) */
function findList(json: unknown, path: string[] = []): { path: string[]; items: Array<Record<string, unknown>> } | undefined {
    if (Array.isArray(json)) {
        return json.length && json.every((i) => i && typeof i === 'object' && 'id' in (i as object))
            ? { path, items: json as Array<Record<string, unknown>> }
            : undefined;
    }
    if (json && typeof json === 'object') {
        for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
            const found = findList(v, [...path, k]);
            if (found) return found;
        }
    }
    return undefined;
}

// فرق الساعة بين الجهاز والسيرفر اللي بنسمح بيه لما نقارن created_at بوقت الأكشن
const CLOCK_SKEW_MS = 2 * 60 * 1000;

function itemTime(item: Record<string, unknown>): number | undefined {
    for (const key of ['created_at', 'updated_at', 'createdAt', 'updatedAt']) {
        const t = typeof item[key] === 'string' ? Date.parse(item[key] as string) : NaN;
        if (!Number.isNaN(t)) return t;
    }
    return undefined;
}

/**
 * وضع "الأكشن بس": بيعرض الداتا اللي اتعملت في التيست، مش كل داتا الصفحة.
 * - قبل أول أكشن (POST / PUT / PATCH / DELETE): الـ lists بتتسجل بس (baseline) ومش بتتطبع
 * - بعد الأكشن: الـ list بتعرض بس العناصر الجديدة
 *     • الـ id عمره ما ظهر قبل كده على نفس الـ endpoint
 *     • والـ created_at / updated_at بعد وقت الأكشن (لو موجودين)
 * - list مفيهاش عناصر جديدة ➜ مش بتتطبع خالص
 */
export class NewItemsTracker {
    private readonly seenByEndpoint = new Map<string, Set<unknown>>();
    private firstActionAt: number | undefined;

    /** بيتنادى لما يحصل أكشن (create / update / delete / upload) */
    markAction(at = Date.now()) {
        this.firstActionAt ??= at;
    }

    /**
     * undefined ➜ الـ response مش list
     * { skip: true } ➜ list مفيهاش جديد (متطبعهاش)
     * { text, note } ➜ الـ response بالعناصر الجديدة بس
     */
    filter(url: string, responseText: string): { skip: true } | { skip?: false; text: string; note: string } | undefined {
        const json = tryParseJson(responseText);
        const list = findList(json);
        if (!list) return undefined;

        const endpoint = new URL(url, 'http://localhost').pathname;
        const seen = this.seenByEndpoint.get(endpoint);
        const hadBaseline = !!seen;
        const seenIds = seen ?? new Set<unknown>();
        this.seenByEndpoint.set(endpoint, seenIds);

        const actionAt = this.firstActionAt;
        const fresh = actionAt === undefined ? [] : list.items.filter((i) => {
            if (seenIds.has(i.id)) return false;
            const t = itemTime(i);
            if (t === undefined) return hadBaseline;          // مفيش تاريخ ➜ نعتمد على الـ baseline بس
            return t >= actionAt - CLOCK_SKEW_MS;
        });
        list.items.forEach((i) => seenIds.add(i.id));

        if (!fresh.length) return { skip: true };

        // نستبدل الـ array بالعناصر الجديدة بس
        let node = json as Record<string, unknown>;
        for (const k of list.path.slice(0, -1)) node = node[k] as Record<string, unknown>;
        if (list.path.length) node[list.path[list.path.length - 1]] = fresh;
        const text = list.path.length ? JSON.stringify(json) : JSON.stringify(fresh);

        return { text, note: `🆕 ${fresh.length} new item(s) – showing only what this test created` };
    }
}

/** بيبني النص (plain) – بيرجّع undefined لو الـ call مكرر */
export function formatApiCall(call: ApiCall, { dedupe = true } = {}): { plain: string; colored: string } | undefined {
    const key = `${call.method} ${call.url} ${call.status} ${call.responseText.length}:${call.responseText.slice(0, 200)}`;
    if (dedupe && isDuplicate(key)) return undefined;

    const icon = call.status >= 400 ? '❌' : '✅';
    const time = call.timeMs !== undefined ? ` · ${call.timeMs} ms` : '';
    const head = `${icon} ${call.method} ${call.status} ${call.statusText ?? ''}`.trimEnd() + time;
    const json = tryParseJson(call.responseText);

    const sections = (c: (s: string) => string) => [
        c('▸ Payload'), indent(buildPayload(call.url, call.requestBody, call.requestContentType, call.requestNote)),
        c('▸ Preview'), indent(buildPreview(json)),
        c('▸ Response'), indent(buildResponse(call.responseText, call.fullResponse ? Infinity : MAX_RESPONSE)),
    ];

    const plain = [
        `━━━ ${call.label ? call.label + ' · ' : ''}${head} ━━━`,
        decodeURIComponent(call.url),
        call.resultLine ?? '',
        ...sections((s) => s),
    ].filter(Boolean).join('\n');

    const colored = [
        `${COLOR.bold}${statusColor(call.status)}━━━ ${call.label ? call.label + ' · ' : ''}${head} ━━━${COLOR.reset}`,
        `${COLOR.dim}${decodeURIComponent(call.url)}${COLOR.reset}`,
        call.resultLine ? `${COLOR.bold}${call.resultOk ? COLOR.green : COLOR.red}${call.resultLine}${COLOR.reset}` : '',
        ...sections((s) => `${COLOR.cyan}${s}${COLOR.reset}`),
    ].filter(Boolean).join('\n');

    return { plain, colored };
}

/** بيطبع الـ call في التيرمنال مرة واحدة بس */
export function printApiCall(call: ApiCall): string | undefined {
    const out = formatApiCall(call);
    if (out) console.log('\n' + out.colored + '\n');
    return out?.plain;
}
