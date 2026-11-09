<div dir="rtl">

# Sallamat – Test Automation

مشروع أوتوميشن لاختبار منصة **سلامات (Sallamat)** على البيئة التجريبية `demo.sallamaat.com`.
المشروع مبني بـ **Playwright + TypeScript** وبيستخدم نمط **Page Object Model (POM)**، وبيغطي نوعين من الاختبارات:

- **UI (End-to-End):** بيفتح البراوزر ويعمل نفس اللي المستخدم بيعمله (تسجيل دخول، إنشاء حملة، رفع ملف، فلترة...).
- **API:** بيكلّم الـ APIs مباشرة من غير براوزر ويتأكد من الـ Response.

</div>

---

<div dir="rtl">

## فهرس

1. [المشروع بيختبر إيه؟](#المشروع-بيختبر-إيه)
2. [هيكل المشروع](#هيكل-المشروع)
3. [شرح كل فولدر بالتفصيل](#شرح-كل-فولدر-بالتفصيل)
4. [ملفات الإعدادات](#ملفات-الإعدادات)
5. [التسطيب](#التسطيب)
6. [تشغيل التستات](#تشغيل-التستات)
7. [إزاي التستات بتشتغل](#إزاي-التستات-بتشتغل)
8. [إزاي تضيف تيست جديد](#إزاي-تضيف-تيست-جديد)

## المشروع بيختبر إيه؟

| الجزء في الموقع | التستات |
|---|---|
| **تسجيل الدخول** | فتح صفحة اللوجين، دخول صحيح، باسوورد غلط، حقول فاضية + نفس الحالات على مستوى الـ API |
| **الحملات اليدوية** | إنشاء حملة يدوية كاملة (اسم ← جمهور ← قالب ← إنشاء) |
| **فلاتر الحملات اليدوية** | مربع البحث + كل فلتر لوحده: الحالة، القالب، حالة القالب، المجموعة، نطاق التاريخ، الترتيب الزمني |
| **الحملات التلقائية** | إنشاء حملة تلقائية (اسم ← وصف ← حدث ← قالب ← تفعيل) |
| **القوالب** | إنشاء قالب بنص فقط / صورة / فيديو / ملف PDF |
| **صندوق الإعلان** | إنشاء إعلان مع رفع صورة الإعلان ← الخطوات ← إطلاق الإعلان |
| **العملاء** | تنزيل ملف الإكسل، ملؤه ببيانات عملاء، رفعه وتأكيد الرفع |

## هيكل المشروع

```
sallamat-official/
├── .github/workflows/
│   └── playwright.yml              # تشغيل التستات أوتوماتيك على GitHub
├── tests/
│   ├── specs/                      # ملفات التستات (مقسمة حسب الفيتشر)
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   └── login.api.spec.ts
│   │   ├── campaigns/
│   │   │   ├── manualCampaign.spec.ts
│   │   │   ├── autoCampaign.spec.ts
│   │   │   └── manual-filters/
│   │   │       ├── 01-search.spec.ts
│   │   │       ├── 02-status.spec.ts
│   │   │       ├── 03-template.spec.ts
│   │   │       ├── 04-template-status.spec.ts
│   │   │       ├── 05-group.spec.ts
│   │   │       ├── 06-date-range.spec.ts
│   │   │       └── 07-sorting.spec.ts
│   │   ├── templates/
│   │   │   ├── createTemplate.text.spec.ts
│   │   │   ├── createTemplate.image.spec.ts
│   │   │   ├── createTemplate.video.spec.ts
│   │   │   └── createTemplate.file.spec.ts
│   │   ├── ads/
│   │   │   └── createAd.spec.ts
│   │   └── customers/
│   │       └── uploadCustomers.spec.ts
│   ├── pages/                      # Page Objects (اللوكيتورز والأكشنز لكل صفحة)
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── ManualCampaignPage.ts
│   │   ├── ManualCampaignsListPage.ts
│   │   ├── AutoCampaignPage.ts
│   │   ├── TemplatePage.ts
│   │   ├── AdPage.ts
│   │   └── CustomersPage.ts
│   ├── fixtures/                   # Playwright fixtures (تجهيز مشترك قبل التستات)
│   │   └── manualCampaignsList.fixture.ts
│   ├── utils/                      # أدوات مساعدة
│   │   ├── apiLogFormat.ts
│   │   ├── apiLogger.ts
│   │   ├── authResult.ts
│   │   └── excelHelper.ts
│   ├── testdata/
│   │   └── testdata.json           # بيانات الدخول
│   └── assets/                     # ملفات بتترفع أثناء التستات
│       ├── ad-image.png
│       ├── sample.png
│       ├── sample.mp4
│       └── sample.pdf
├── playwright.config.ts            # إعدادات Playwright
├── tsconfig.json                   # إعدادات TypeScript
├── package.json                    # المكتبات والأوامر (scripts)
└── README.md
```

## شرح كل فولدر بالتفصيل

### `tests/specs/` – ملفات التستات

ده المكان الوحيد اللي فيه التستات نفسها (`*.spec.ts`). Playwright بيدوّر على التستات هنا بس (`testDir: './tests/specs'`).
كل فولدر جواه = جزء من الموقع، وكل ملف بيوصف **السيناريو** بس (إيه اللي بيحصل وإيه المتوقع)، أما **إزاي** نضغط على الزراير فده موجود في `pages/`.

#### `specs/auth/` – تسجيل الدخول

| الملف | بيعمل إيه |
|---|---|
| `login.spec.ts` | **UI:** صفحة اللوجين بتفتح والفورم ظاهر، الدخول بإيميل وباسوورد صح، الدخول بباسوورد غلط يفضل في صفحة اللوجين، الدخول بحقول فاضية يفضل في صفحة اللوجين |
| `login.api.spec.ts` | **API:** بيجيب الـ CSRF token، بيعمل login صح ويتأكد إن الـ session اتعملت، باسوورد غلط ← 401، من غير CSRF ← رفض، حقول فاضية ← فشل. بيستخدم `sendAndLog` من `utils/apiLogger.ts` و`interpretAuth` من `utils/authResult.ts` |

#### `specs/campaigns/` – الحملات

| الملف | بيعمل إيه |
|---|---|
| `manualCampaign.spec.ts` | إنشاء حملة يدوية: الحملات اليدوية ← إنشاء حملة ← اسم عشوائي ← أول جمهور ← القالب `fffffffffffff` ← إنشاء الحملة ← التأكد إن اسم الحملة ظهر |
| `autoCampaign.spec.ts` | إنشاء حملة تلقائية: الحملات التلقائية ← إنشاء ← الاسم والوصف ← الحدث "تم إنشاء عميل" ← التالي ← القالب `fffffffffffff` + الشيك بوكس ← تفعيل الحملة |

#### `specs/campaigns/manual-filters/` – البحث والفلاتر في صفحة الحملات اليدوية

كل فلتر في ملف لوحده ومترقمين بالترتيب اللي ظاهر في الصفحة. كل تيست بيتأكد من 3 حاجات:
1. الـ API (`GET /api/campaign?filter[...]`) اتبعت صح ورجّع 200.
2. زرار الفلتر بيعرض القيمة اللي اخترناها.
3. **كل صف** في الجدول مطابق للفلتر.

| الملف | بيعمل إيه |
|---|---|
| `01-search.spec.ts` | البحث باسم حملة موجودة (كل النتايج فيها الكلمة)، اسم مش موجود (الجدول فاضي)، مسح البحث (الجدول يرجع زي ما كان) |
| `02-status.spec.ts` | قائمة الحالات صحيحة + تيست لكل حالة من الـ 8: مسودة، مكتملة، جاري الارسال، متوقفة، فشل الارسال، مجدولة، مؤجلة، قيد الانتظار |
| `03-template.spec.ts` | فلتر القالب `fffffffffffff` + مربع البحث اللي جوه الفلتر بيفلتر الاختيارات |
| `04-template-status.spec.ts` | قائمة حالات القالب صحيحة + تيست لكل حالة من الـ 5: معتمد، قيد الانتظار، متوقف مؤقتا، مرفوض، معطل |
| `05-group.spec.ts` | فلتر المجموعة `shady` (بيبعت `filter[group_ids][]`) |
| `06-date-range.spec.ts` | نطاق تاريخ من أول الشهر الحالي لحد النهارده – كل التواريخ في الجدول جوه النطاق |
| `07-sorting.spec.ts` | من الأقدم للأحدث (`sort=created_at`)، من الأحدث للأقدم هو الافتراضي (`sort=-created_at`)، والرجوع للأحدث بيرجّع نفس الترتيب الأصلي |

> لو حالة مفيهاش حملات في الداتا، التيست بينجح بس بيتكتب عليه ملاحظة **"No campaigns"** في الريبورت.

#### `specs/templates/` – القوالب

4 ملفات، كل واحد بينشئ قالب بنوع مرفق مختلف باستخدام `TemplatePage.createTemplate()`:

| الملف | نوع المرفق | الملف اللي بيترفع |
|---|---|---|
| `createTemplate.text.spec.ts` | نص فقط (هيدر نصي) | – |
| `createTemplate.image.spec.ts` | صورة | `assets/sample.png` |
| `createTemplate.video.spec.ts` | فيديو | `assets/sample.mp4` |
| `createTemplate.file.spec.ts` | ملف | `assets/sample.pdf` |

#### `specs/ads/` – صندوق الإعلان

| الملف | بيعمل إيه |
|---|---|
| `createAd.spec.ts` | صندوق الإعلان ← إنشاء إعلان ← رفع صورة الإعلان (`assets/ad-image.png` – 800×600) في مربع "صورة الإعلان" ← الخطوة القادمة ×4 ← إطلاق الإعلان |

#### `specs/customers/` – العملاء

| الملف | بيعمل إيه |
|---|---|
| `uploadCustomers.spec.ts` | العملاء ← رفع البيانات يدويًا ← "اضغط للتنزيل" (بينزّل ملف الإكسل) ← يملاه بـ 3 عملاء بأرقام سعودية صحيحة ← يرفعه ← تأكيد ← يتأكد إن أول عميل ظهر في الجدول |

---

### `tests/pages/` – الـ Page Objects

كل صفحة في الموقع ليها كلاس فيه:
- **Locators:** مكان كل عنصر في الصفحة (زرار، input، جدول...).
- **Actions:** الأفعال اللي بتتعمل في الصفحة (`fillName()`, `clickNext()`, `selectFilter()`...).
- **Flow كامل:** دالة واحدة بتعمل السيناريو كله (مثلًا `createAd()`).

الفايدة: لو لوكيتور اتغير في الموقع بنعدّله في مكان واحد بس، وكل التستات اللي بتستخدمه تتصلح.

| الملف | الصفحة | أهم الدوال |
|---|---|---|
| `BasePage.ts` | **الأساس** – كل الصفحات بتورث منه | `enableApiLogging()`: بيطبع كل API call في التيرمنال (Payload / Preview / Response) مرة واحدة |
| `LoginPage.ts` | صفحة تسجيل الدخول | `goto()`, `login(email, password)`, `expectLoggedIn()`, `expectStillOnLogin()` |
| `ManualCampaignPage.ts` | إنشاء حملة يدوية | `openManualCampaigns()`, `fillCampaignName()`, `selectAudience()`, `selectTemplate()`, `clickCreateCampaign()` |
| `ManualCampaignsListPage.ts` | قائمة الحملات اليدوية (البحث + الفلاتر + الجدول) | `open()`, `search()`, `selectFilter(label, option)`, `selectDateRange(from, to)`, `getColumnValues()`, `expectAllRows()`, `printTable()` + ثابت `COLUMN` بأرقام أعمدة الجدول |
| `AutoCampaignPage.ts` | إنشاء حملة تلقائية | `createAutoCampaign()`, `selectTemplate()` (بيعلّم على الشيك بوكس), `activateCampaign()` |
| `TemplatePage.ts` | إنشاء قالب | `createTemplate({ type, filePath, ... })`, `selectAttachmentType()`, `submitTemplate()` |
| `AdPage.ts` | صندوق الإعلان | `createAd(imagePath)`, `uploadImage()`, `clickNextStep()`, `launchAd()` |
| `CustomersPage.ts` | العملاء | `openCustomers()`, `clickManualUpload()`, `downloadTemplate()`, `uploadFile()`, `confirm()` |

---

### `tests/fixtures/` – الـ Fixtures

الـ fixture هو تجهيز بيحصل **أوتوماتيك** قبل التيست وبعده، عشان ما نكررش نفس الكود في كل ملف.

| الملف | بيعمل إيه |
|---|---|
| `manualCampaignsList.fixture.ts` | بيستخدمه ملفات `manual-filters/`. **بيعمل login مرة واحدة بس لكل worker** ويحفظ الـ session (`storageState`) ويعيد استخدامها في كل التستات – لأن الموقع بيرفض logins كتير ورا بعض. بعدين بيفعّل طباعة الـ APIs ويفتح صفحة الحملات اليدوية من غير فلاتر، ويدّي التيست `listPage` جاهزة. بعد التيست بيعمل `page.pause()` (إلا لو `CI` أو `NO_PAUSE=1`) |

الاستخدام في التيست:
```ts
import { test, expect } from '../../../fixtures/manualCampaignsList.fixture';

test('...', async ({ listPage }) => {
    await listPage.selectFilter('الحالة', 'مكتملة');
});
```

---

### `tests/utils/` – أدوات مساعدة

| الملف | بيعمل إيه |
|---|---|
| `apiLogFormat.ts` | **الفورمات الموحّد** لطباعة أي API call في التيرمنال: **Payload** (الـ query params أو الـ body) – **Preview** (ملخص: المفاتيح وعدد العناصر) – **Response** (الـ JSON، بيتقص بعد 1200 حرف). بيمنع التكرار (نفس الـ call في 5 ثواني بيتطبع مرة)، وبيخفي الباسوورد والتوكن |
| `apiLogger.ts` | `sendAndLog()` لتستات الـ API: بيبعت الـ request، يقيس الوقت، يطبع النتيجة بنفس الفورمات + سطر ✅ SUCCESS / ❌ FAILED، ويضيفها للريبورت |
| `authResult.ts` | `interpretAuth()`: بيفهم رد الـ login (next-auth بيرجّع 200 حتى لو فشل، فبيقرا الـ `error` من الـ URL ويحوّله لـ 401/403/...) |
| `excelHelper.ts` | `generateCustomers()`: بيولّد عملاء بأسماء وإيميلات وأرقام موبايل سعودية صحيحة (50/53/54/55/56/58/59). `fillCustomersTemplate()`: بيفتح ملف الإكسل اللي اتنزل، يقرا أسماء الأعمدة، ويملاها حسب اسم كل عمود (عربي أو إنجليزي). لو فيه عمود منفصل لكود الدولة بيكتب `966` فيه والرقم من غير الكود |

---

### `tests/testdata/` – بيانات الاختبار

| الملف | بيعمل إيه |
|---|---|
| `testdata.json` | بيانات الدخول: `validUser` (حساب صحيح) و`invalidUser` (باسوورد غلط). كل التستات بتقرا منه، فلو الباسوورد اتغير بنعدّله هنا بس |

---

### `tests/assets/` – ملفات الرفع

ملفات ثابتة بتترفع أثناء التستات:

| الملف | مستخدم في |
|---|---|
| `ad-image.png` | صورة الإعلان (800×600 – المقاس الموصى بيه في الموقع) |
| `sample.png` | قالب بصورة |
| `sample.mp4` | قالب بفيديو |
| `sample.pdf` | قالب بملف |

---

### `.github/workflows/` – GitHub Actions

| الملف | بيعمل إيه |
|---|---|
| `playwright.yml` | مع كل push أو pull request على `main`: بيسطّب المكتبات والبراوزرات، يشغّل كل التستات، ويرفع الريبورت كـ artifact لمدة 30 يوم. على الـ CI البراوزر بيشتغل headless |

---

### فولدرات بتتعمل أوتوماتيك (مش في git)

| الفولدر | فيه إيه |
|---|---|
| `playwright-report/` | ريبورت HTML لآخر رن |
| `test-results/` | لكل تيست فشل: سكرين شوت + فيديو + trace. وكمان ملفات الإكسل اللي اتنزلت واتملت |
| `node_modules/` | المكتبات |

## ملفات الإعدادات

| الملف | أهم الإعدادات |
|---|---|
| `playwright.config.ts` | `testDir: ./tests/specs` – الريبورتر `list` (بيطبع في التيرمنال) + `html` (بيفتح بعد كل رن) – `screenshot`/`video`/`trace` عند الفشل بس – البراوزر ظاهر إلا لو `HEADLESS=1` أو CI – Chromium |
| `tsconfig.json` | إعدادات TypeScript (strict، قراءة JSON، أنواع Node) |
| `package.json` | المكتبات (`@playwright/test`, `exceljs`, `typescript`) والأوامر المختصرة |

## التسطيب

```bash
npm ci
npx playwright install
```

## تشغيل التستات

| الأمر | بيشغّل إيه |
|---|---|
| `npm test` | كل التستات |
| `npm run test:auth` | اللوجين (UI + API) |
| `npm run test:campaigns` | الحملات اليدوية والتلقائية والفلاتر |
| `npm run test:filters` | البحث والفلاتر بس |
| `npm run test:templates` | كل أنواع القوالب |
| `npm run test:ads` | الإعلان |
| `npm run test:customers` | رفع العملاء بالإكسل |
| `npm run test:api` | تستات الـ API بس |
| `npm run test:debug` | تشغيل مع الـ Inspector خطوة بخطوة |
| `npm run report` | فتح آخر ريبورت |
| `npm run typecheck` | فحص أخطاء TypeScript |

تشغيل ملف واحد:
```bash
npx playwright test tests/specs/campaigns/manualCampaign.spec.ts
```

تشغيل تيست واحد بالاسم:
```bash
npx playwright test -g "status = مكتملة"
```

### متغيرات اختيارية (PowerShell)

| المتغير | بيعمل إيه |
|---|---|
| `$env:HEADLESS="1"` | التستات تشتغل من غير ما البراوزر يظهر |
| `$env:NO_PAUSE="1"` | البراوزر ما يستناش Resume في آخر تستات الفلاتر |
| `$env:API_LOG_BODY="5000"` | يطبع Response أطول في التيرمنال |
| `$env:SHOW_SECRETS="1"` | يعرض الباسوورد والتوكن في اللوج بدل `********` |

مثال:
```powershell
$env:HEADLESS="1"; $env:NO_PAUSE="1"; npm run test:filters
```

## إزاي التستات بتشتغل

- **الـ APIs في التيرمنال:** كل call بيتطبع **مرة واحدة** بالشكل ده:
  ```
  ━━━ ✅ GET 200 OK · 856 ms ━━━
  https://api.demo.sallamaat.com/api/campaign?...
  ▸ Payload
    filter[name]: Auto Campaig
  ▸ Preview
    data: { data, statistics, pagination }
      data: Array(12)
  ▸ Response
    { ... }
  ```
- **البراوزر بيفضل مفتوح بعد الرن:** التستات بتعمل `page.pause()` في الآخر – اضغط **Resume** في نافذة Playwright Inspector عشان يخلص.
- **ريبورت بعد كل رن:** `playwright-report/index.html` بيفتح لوحده (نجاح أو فشل).
- **لو تيست فشل:** سكرين شوت + فيديو + trace بيتحفظوا ويظهروا جوه الريبورت.
- **بيانات عشوائية:** أسماء الحملات والقوالب والعملاء بتتولّد بـ `Date.now()` عشان كل رن يبقى فريد.

## إزاي تضيف تيست جديد

1. **لو الصفحة جديدة:** اعمل كلاس في `tests/pages/` بيورث من `BasePage`:
   ```ts
   import { expect, type Locator, type Page } from '@playwright/test';
   import { BasePage } from './BasePage';

   export class MyPage extends BasePage {
       readonly saveButton: Locator;

       constructor(page: Page) {
           super(page);
           this.saveButton = page.locator("//button[contains(text(),'حفظ')]");
       }

       async save() {
           await expect(this.saveButton).toBeEnabled();
           await this.saveButton.click();
       }
   }
   ```
2. **اعمل ملف التيست** في الفولدر المناسب جوه `tests/specs/<feature>/` باسم `something.spec.ts`.
3. في `beforeEach`: اعمل login من `LoginPage` وفعّل `enableApiLogging()`.
4. **الملفات اللي بتترفع** حطها في `tests/assets/`، و**البيانات الثابتة** في `tests/testdata/`.
5. شغّل `npm run typecheck` وبعدين التيست.

</div>
