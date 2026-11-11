/**
 * العربي في التيرمنال.
 *
 * تيرمنال VS Code (وأغلب تيرمنالات Windows) مش بيدعم العربي:
 *   - مش بيوصّل الحروف ببعض  ➜  "ت م ج ل ب"
 *   - مش بيكتب من اليمين للشمال  ➜  الكلمة بتظهر معكوسة
 *
 * الملف ده بيصلّح الاتنين قبل ما الكلام يتطبع:
 *   1) shaping: كل حرف بيتحوّل لشكله الصح (أول / وسط / آخر الكلمة) من Arabic Presentation Forms
 *   2) RTL: الجملة العربي بتتعكس عشان تتقري صح في تيرمنال بيكتب من الشمال لليمين
 *      (الأرقام والإنجليزي اللي جوه الجملة بيفضلوا بنفس ترتيبهم)
 *
 * - بيتطبق على التيرمنال بس (TTY) – الـ HTML report والملفات بيفضلوا بالعربي الأصلي
 * - ARABIC_RAW=1 ➜ يطفيه (لو التيرمنال بتاعك بيدعم العربي أصلًا)
 * - ARABIC_SHAPING=1 ➜ يشغله حتى لو الـ output رايح لملف
 */

// [isolated, final, initial, medial] – الحروف اللي مش بتتوصل باللي بعدها ليها شكلين بس
const FORMS: Record<string, number[]> = {};
const dual = (ch: number, base: number) => { FORMS[String.fromCharCode(ch)] = [base, base + 1, base + 2, base + 3]; };
const right = (ch: number, base: number) => { FORMS[String.fromCharCode(ch)] = [base, base + 1]; };

FORMS['ء'] = [0xfe80];                         // ء
right(0x0622, 0xfe81); right(0x0623, 0xfe83);       // آ أ
right(0x0624, 0xfe85); right(0x0625, 0xfe87);       // ؤ إ
dual(0x0626, 0xfe89);                               // ئ
right(0x0627, 0xfe8d);                              // ا
dual(0x0628, 0xfe8f);                               // ب
right(0x0629, 0xfe93);                              // ة
dual(0x062a, 0xfe95); dual(0x062b, 0xfe99);         // ت ث
dual(0x062c, 0xfe9d); dual(0x062d, 0xfea1); dual(0x062e, 0xfea5); // ج ح خ
right(0x062f, 0xfea9); right(0x0630, 0xfeab);       // د ذ
right(0x0631, 0xfead); right(0x0632, 0xfeaf);       // ر ز
dual(0x0633, 0xfeb1); dual(0x0634, 0xfeb5);         // س ش
dual(0x0635, 0xfeb9); dual(0x0636, 0xfebd);         // ص ض
dual(0x0637, 0xfec1); dual(0x0638, 0xfec5);         // ط ظ
dual(0x0639, 0xfec9); dual(0x063a, 0xfecd);         // ع غ
dual(0x0641, 0xfed1); dual(0x0642, 0xfed5);         // ف ق
dual(0x0643, 0xfed9); dual(0x0644, 0xfedd);         // ك ل
dual(0x0645, 0xfee1); dual(0x0646, 0xfee5);         // م ن
dual(0x0647, 0xfee9);                               // ه
right(0x0648, 0xfeed); right(0x0649, 0xfeef);       // و ى
dual(0x064a, 0xfef1);                               // ي
FORMS['ـ'] = [0x0640, 0x0640, 0x0640, 0x0640]; // ـ

// لا لأ لإ لآ ➜ [isolated, final]
const LAM_ALEF: Record<string, number[]> = {
    'آ': [0xfef5, 0xfef6], 'أ': [0xfef7, 0xfef8],
    'إ': [0xfef9, 0xfefa], 'ا': [0xfefb, 0xfefc],
};

const HARAKAT = /[ً-ْٰ]/g;            // التشكيل – بيتشال عشان التيرمنال بيعرضه غلط
const ARABIC = '؀-ۿﭐ-﷿ﹰ-﻿';
const HAS_ARABIC = /[؀-ۿ]/;
// جملة عربي: تبدأ وتخلص بحرف عربي، وجواها مسافات / أرقام / علامات
const RTL_RUN = new RegExp(`[${ARABIC}](?:[${ARABIC} \\t\\d.,،:؛!؟?()\\-–_/%+*]*[${ARABIC}])?`, 'g');
const ARABIC_TOKEN = new RegExp(`^[${ARABIC}]+$`);
const MIRROR: Record<string, string> = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' };

const joinsNext = (ch?: string) => !!ch && (FORMS[ch]?.length ?? 0) === 4;
const isLetter = (ch?: string) => !!ch && ch in FORMS;

/** بيحوّل كل حرف لشكله الصح حسب مكانه في الكلمة (الترتيب لسه منطقي مش معكوس) */
function shape(word: string): string {
    const chars = [...word];
    let out = '';
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const forms = FORMS[ch];
        if (!forms) { out += ch; continue; }

        const prevJoins = joinsNext(chars[i - 1]);

        // لام + ألف ➜ حرف واحد (لا)
        if (ch === 'ل' && LAM_ALEF[chars[i + 1]]) {
            out += String.fromCharCode(LAM_ALEF[chars[i + 1]][prevJoins ? 1 : 0]);
            i++;
            continue;
        }

        const nextJoins = forms.length === 4 && isLetter(chars[i + 1]);
        const form = prevJoins && nextJoins ? 3 : prevJoins ? 1 : nextJoins ? 2 : 0;
        out += String.fromCharCode(forms[form] ?? forms[0]);
    }
    return out;
}

/** بيعكس الجملة العربي عشان تتقري صح – الأرقام والإنجليزي جواها بيفضلوا زي ما هم */
function reverseRun(run: string): string {
    const tokens = run.match(new RegExp(`[${ARABIC}]+|[^${ARABIC}]+`, 'g')) ?? [];
    return tokens
        .reverse()
        .map((t) => (ARABIC_TOKEN.test(t) ? [...t].reverse().join('') : [...t].map((c) => MIRROR[c] ?? c).join('')))
        .join('');
}

/** بيجهز أي نص فيه عربي عشان يتعرض صح في التيرمنال */
export function fixArabicForTerminal(text: string): string {
    if (!HAS_ARABIC.test(text)) return text;
    return text
        .split('\n')
        .map((line) => {
            if (!HAS_ARABIC.test(line)) return line;
            let result = '';
            let last = 0;
            for (const m of line.matchAll(RTL_RUN)) {
                const start = m.index ?? 0;
                const end = start + m[0].length;
                const out = reverseRun(shape(m[0].replace(HARAKAT, '')));
                result += line.slice(last, start) + out;
                last = end;

                // لام-ألف بتقلّل الطول ➜ نعوّض بمسافات قبل أول مسافة بعد الكلمة
                // عشان أعمدة جداول console.table تفضل مظبوطة
                const lost = m[0].length - out.length;
                const space = line.indexOf(' ', end);
                if (lost > 0 && space !== -1 && !HAS_ARABIC.test(line.slice(end, space))) {
                    result += line.slice(end, space) + ' '.repeat(lost);
                    last = space;
                }
            }
            return result + line.slice(last);
        })
        .join('\n');
}

/** بيلف process.stdout / stderr عشان أي حاجة تتطبع في التيرمنال يتصلح العربي فيها */
export function installArabicTerminalFix() {
    if (process.env.ARABIC_RAW === '1') return;
    const force = process.env.ARABIC_SHAPING === '1';

    for (const stream of [process.stdout, process.stderr]) {
        if (!force && !stream.isTTY) continue;
        const original = stream.write.bind(stream) as (...args: unknown[]) => boolean;
        stream.write = ((chunk: unknown, ...rest: unknown[]) => {
            const text = typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) || chunk instanceof Uint8Array ? Buffer.from(chunk).toString('utf8') : undefined;
            return original(text !== undefined ? fixArabicForTerminal(text) : chunk, ...rest);
        }) as typeof stream.write;
    }
}
