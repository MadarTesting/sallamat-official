# أوامر الرن – Sallamat

انسخ الأمر اللي عايزه وشغله في التيرمنال من فولدر المشروع.

---

## 🔁 كل التستات

```bash
npx playwright test
```

---

## 🔐 Auth

```bash
# الفولدر كله
npx playwright test tests/specs/auth

# Login (UI)
npx playwright test tests/specs/auth/login.spec.ts

# Login (API)
npx playwright test tests/specs/auth/login.api.spec.ts
```

---

## 📣 Campaigns

```bash
# الفولدر كله (الحملات + الفلاتر)
npx playwright test tests/specs/campaigns

# إنشاء حملة يدوية
npx playwright test tests/specs/campaigns/manual-filters/05-group.spec.ts

# إنشاء حملة تلقائية
npx playwright test tests/specs/campaigns/autoCampaign.spec.ts
```

### 🔎 Manual Filters (فلاتر الحملات اليدوية)

```bash
# الفولدر كله
npx playwright test tests/specs/campaigns/manual-filters

# Search
npx playwright test tests/specs/campaigns/manual-filters/01-search.spec.ts

# Status
npx playwright test tests/specs/campaigns/manual-filters/02-status.spec.ts

# Template
npx playwright test tests/specs/campaigns/manual-filters/03-template.spec.ts

# Template status
npx playwright test tests/specs/campaigns/manual-filters/04-template-status.spec.ts

# Group
npx playwright test tests/specs/campaigns/manual-filters/05-group.spec.ts

# Date range
npx playwright test tests/specs/campaigns/manual-filters/06-date-range.spec.ts

# Sorting
npx playwright test tests/specs/campaigns/manual-filters/07-sorting.spec.ts
```

### 🔎 Auto Filters (فلاتر الحملات التلقائية)

```bash
# الفولدر كله
npx playwright test tests/specs/campaigns/auto-filters

# Search
npx playwright test tests/specs/campaigns/auto-filters/01-search.spec.ts

# Status
npx playwright test tests/specs/campaigns/auto-filters/02-status.spec.ts

# Event
npx playwright test tests/specs/campaigns/auto-filters/03-event.spec.ts

# Template status
npx playwright test tests/specs/campaigns/auto-filters/04-template-status.spec.ts

# Date range
npx playwright test tests/specs/campaigns/auto-filters/05-date-range.spec.ts

# Sorting
npx playwright test tests/specs/campaigns/auto-filters/06-sorting.spec.ts
```

---

## 📝 Templates

```bash
# الفولدر كله
npx playwright test tests/specs/templates

# قالب نصي
npx playwright test tests/specs/templates/createTemplate.text.spec.ts

# قالب صورة
npx playwright test tests/specs/templates/createTemplate.image.spec.ts

# قالب فيديو
npx playwright test tests/specs/templates/createTemplate.video.spec.ts

# قالب ملف
npx playwright test tests/specs/templates/createTemplate.file.spec.ts
```

---

## 📢 Ads

```bash
npx playwright test tests/specs/ads/createAd.spec.ts
```

---

## 👥 Customers

```bash
# رفع عملاء من Excel (بيطبع Payload / Preview / Response كاملين)
npx playwright test tests/specs/customers/uploadCustomers.spec.ts
```

### 🔎 Customers Filters (فلاتر العملاء + البحث)

```bash
# الفولدر كله
npx playwright test tests/specs/customers/filters

# Search (اسم العميل / رقم الهاتف)
npx playwright test tests/specs/customers/filters/01-search.spec.ts

# العملاء (نوع العميل)
npx playwright test tests/specs/customers/filters/02-customer-type.spec.ts

# تاريخ آخر تعديل
npx playwright test tests/specs/customers/filters/03-date-range.spec.ts

# الحملات
npx playwright test tests/specs/customers/filters/04-campaign.spec.ts

# النوع (ذكر / أنثى)
npx playwright test tests/specs/customers/filters/05-gender.spec.ts

# الترتيب الزمني
npx playwright test tests/specs/customers/filters/06-sorting.spec.ts

# أكتر من فلتر مع بعض
npx playwright test tests/specs/customers/filters/07-combined.spec.ts
```

---

## ⚙️ إضافات تحطها في آخر أي أمر

| الإضافة | بتعمل إيه |
|---|---|
| `--headed` | البراوزر يظهر (هو أصلًا ظاهر افتراضيًا) |
| `--debug` | تمشي خطوة بخطوة بالـ Inspector |
| `--ui` | واجهة Playwright التفاعلية |
| `-g "اسم التست"` | تشغل تست واحد بالاسم بس |
| `--reporter=line` | لوج أقصر في التيرمنال |
| `--repeat-each=3` | تكرر التست 3 مرات |
| `--workers=1` | التستات تمشي ورا بعض مش مع بعض |

**مثال:**
```bash
npx playwright test tests/specs/campaigns/auto-filters/02-status.spec.ts -g "status filter lists" --debug
```

---

## 🖥️ متغيرات التشغيل (PowerShell)

```powershell
# من غير ما البراوزر يظهر
$env:HEADLESS="1"; npx playwright test tests/specs/campaigns/auto-filters

# Response أطول في التيرمنال (الافتراضي 1200 حرف)
$env:API_LOG_BODY="100000"; npx playwright test tests/specs/campaigns/auto-filters/01-search.spec.ts

# إظهار الباسوورد والتوكن في اللوج
$env:SHOW_SECRETS="1"; npx playwright test tests/specs/auth/login.spec.ts

# العربي بالشكل الأصلي (لو التيرمنال بتاعك بيدعم العربي من نفسه)
$env:ARABIC_RAW="1"; npx playwright test tests/specs/customers/uploadCustomers.spec.ts
```

> المتغيرات دي بتفضل شغالة في نفس نافذة التيرمنال. عشان تلغيها:
> `Remove-Item Env:HEADLESS, Env:API_LOG_BODY, Env:SHOW_SECRETS, Env:ARABIC_RAW -ErrorAction SilentlyContinue`

---

## 🧾 الداتا اللي بتتطبع في التيرمنال

- **تستات الأكشن** (create حملة / قالب / إعلان / رفع عملاء): بيتطبع **الداتا اللي التيست عملها بس**
  - طلب الأكشن نفسه (POST / PUT / DELETE) بالـ Payload والـ Response كاملين
  - الملفات اللي بتتحمل
  - العناصر الجديدة بس من أي list بعد الأكشن
  - أي request فشل (4xx / 5xx)
- **تستات الفلاتر**: بيتطبع كل request بنتايجه (عشان تشوف الفلتر رجّع إيه)
- عايز كل الـ APIs في تيست أكشن؟ غيّر `enableApiLogging()` لـ `enableApiLogging({ newOnly: false })`

---

## 📊 التقرير

```bash
npx playwright show-report
```
