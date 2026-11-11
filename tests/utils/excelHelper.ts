import ExcelJS from 'exceljs';

export type CustomerRow = {
    name: string;
    phone: string;        // الرقم كامل بكود الدولة: 9665XXXXXXXX
    localPhone: string;   // الرقم من غير كود الدولة: 5XXXXXXXX (9 أرقام)
    countryCode: string;  // 966
    email: string;
    gender?: string;
    city?: string;
    notes?: string;
};

/**
 * بيربط اسم العمود في ملف الإكسل بالحقل المناسب في الداتا.
 * بيشتغل بالعربي والإنجليزي (مثلًا: "الاسم" / "Name" / "رقم الهاتف" / "Phone").
 */
function matchField(header: string): keyof CustomerRow | undefined {
    const h = header.toLowerCase().trim();
    // عمود كود الدولة لازم يتشيك قبل الهاتف
    if (/كود|رمز|مفتاح|دولة|country|code|dial/.test(h)) return 'countryCode';
    if (/هاتف|جوال|موبايل|phone|mobile/.test(h)) return 'phone';
    if (/بريد|ايميل|إيميل|email|mail/.test(h)) return 'email';
    if (/اسم|name|جهة/.test(h)) return 'name';
    if (/نوع|جنس|gender/.test(h)) return 'gender';
    if (/مدينة|city/.test(h)) return 'city';
    if (/ملاحظ|note/.test(h)) return 'notes';
    return undefined;
}

// بادئات موبايل سعودية صحيحة (50, 53, 54, 55, 56, 58, 59)
const SA_MOBILE_PREFIXES = ['50', '53', '54', '55', '56', '58', '59'];

// نفس القيم اللي في الـ dropdown بتاع عمود "النوع" في القالب (بالظبط: "انثي" بالياء)
export const GENDERS = ['ذكر', 'انثي'] as const;

/** بيولّد عملاء بأرقام موبايل سعودية صحيحة ومختلفة كل رن */
export function generateCustomers(count = 3): CustomerRow[] {
    const stamp = Date.now().toString().slice(-6);
    return Array.from({ length: count }, (_, i) => {
        const prefix = SA_MOBILE_PREFIXES[Math.floor(Math.random() * SA_MOBILE_PREFIXES.length)];
        const rest = Math.floor(1000000 + Math.random() * 8999999).toString(); // 7 أرقام
        const localPhone = `${prefix}${rest}`;                                  // 9 أرقام: 5XXXXXXXX
        return {
            name: `Auto Customer ${stamp}_${i + 1}`,
            phone: `966${localPhone}`,                                         // 9665XXXXXXXX
            localPhone,
            countryCode: '966',
            email: `auto.customer.${stamp}.${i + 1}@example.com`,
            gender: GENDERS[Math.floor(Math.random() * GENDERS.length)],      // ذكر أو انثي عشوائي
        };
    });
}

/**
 * بيفتح ملف الإكسل اللي اتنزل، يقرا الهيدر (الصف الأول)،
 * ويملى الصفوف من الصف التاني بالداتا حسب اسم كل عمود، ويحفظه في outputPath.
 * بيرجّع الهيدرز والداتا اللي اتكتبت عشان نطبعها في التيرمنال.
 */
export async function fillCustomersTemplate(
    templatePath: string,
    outputPath: string,
    customers: CustomerRow[],
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error(`No worksheet found in ${templatePath}`);

    // قراءة الهيدرز
    const headerRow = sheet.getRow(1);
    const headers: { col: number; title: string; field?: keyof CustomerRow }[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
        const title = String(cell.text ?? '').trim();
        if (title) headers.push({ col, title, field: matchField(title) });
    });
    if (headers.length === 0) throw new Error('Excel template has no header row');

    // مسح أي صفوف مثال موجودة تحت الهيدر
    if (sheet.rowCount > 1) sheet.spliceRows(2, sheet.rowCount - 1);

    // لو في عمود منفصل لكود الدولة ➜ عمود الهاتف ياخد الرقم من غير الكود (5XXXXXXXX)
    // غير كده ➜ عمود الهاتف ياخد الرقم كامل بالكود (9665XXXXXXXX)
    const hasCountryCodeColumn = headers.some((h) => h.field === 'countryCode');
    for (const h of headers) {
        if (h.field === 'phone' && hasCountryCodeColumn) h.field = 'localPhone';
    }

    // كتابة الداتا
    const written: Record<string, string>[] = [];
    customers.forEach((customer, i) => {
        const row = sheet.getRow(i + 2);
        const record: Record<string, string> = {};
        for (const h of headers) {
            const value = h.field ? customer[h.field] ?? '' : '';
            row.getCell(h.col).value = value;
            record[h.title] = value;
        }
        row.commit();
        written.push(record);
    });

    await workbook.xlsx.writeFile(outputPath);
    return { headers: headers.map((h) => h.title), rows: written };
}
