import { expect, type Locator, type Page } from '@playwright/test';

export class ManualCampaignPage {
    // ============= Constants =============
    // اسم القالب اللي التست دايمًا بيختاره (لازم يطابق الاسم الظاهر في الكارت بالظبط)
    static readonly DEFAULT_TEMPLATE_NAME = 'fffffffffffff';

    // ============= Variables =============
    readonly page: Page;

    // ============= Locators =============
    readonly manualCampaignsLink: Locator;
    readonly createManualCampaignButton: Locator;
    readonly campaignNameInput: Locator;
    readonly nextButton: Locator;
    readonly audienceCheckboxes: Locator;
    readonly templatePreviewButtons: Locator;
    readonly templateCards: Locator;
    readonly createCampaignButton: Locator;

    // ============= Constructor =============
    constructor(page: Page) {
        this.page = page;

        this.manualCampaignsLink = page.locator("//p[contains(text(),'الحملات اليدوية')]");
        this.createManualCampaignButton = page.locator("//span[contains(text(),'إنشاء حملة يدوية')]");
        this.campaignNameInput = page.locator('#name-input');
        this.nextButton = page.getByRole('button', { name: 'التالي', exact: true });

        // الجمهور: أي checkbox في الخطوة (هنختار أول واحد)
        this.audienceCheckboxes = page.getByRole('checkbox');

        // زر "معاينة القالب": بنستخدم hasText (يدور في كل النص الداخلي
        // حتى لو الزر فيه span أو أيقونة) ومعاه regex يتجاهل اختلاف المسافات
        this.templatePreviewButtons = page.locator('button', {
            hasText: /معاينة\s*القالب/,
        });

        // كارت القالب: أقرب عنصر أب للزر بيحتوي على h3
        // normalize-space(.) بدل text() علشان يشتغل مع النص المتداخل والمسافات
        this.templateCards = page.locator(
            "xpath=//button[contains(normalize-space(.),'معاينة القالب')]/ancestor::*[.//h3][1]"
        );

        // زر "إنشاء الحملة" بس (exact) - بدون "حفظ كمسودة" علشان ما يطابقش زرين
        this.createCampaignButton = page.getByRole('button', {
            name: 'إنشاء الحملة',
            exact: true,
        });
    }

    // ============= API Logging (Postman-like) =============
    // بيطبع في التيرمنال كل Request/Response (Method + URL + Status + Headers + Body)
    enableApiLogging(options: { urlFilter?: RegExp; maxBodyLength?: number } = {}) {
        const { urlFilter, maxBodyLength = 2000 } = options;

        this.page.on('response', async (response) => {
            try {
                const request = response.request();
                const type = request.resourceType();

                // نطبع بس الـ API calls (مش الصور والـ css والـ js)
                if (type !== 'xhr' && type !== 'fetch') return;
                if (urlFilter && !urlFilter.test(request.url())) return;

                const status = response.status();
                const icon = status >= 400 ? '❌' : '✅';

                // Request body
                let reqBody = request.postData() ?? '';
                try {
                    reqBody = JSON.stringify(JSON.parse(reqBody), null, 2);
                } catch {
                    /* مش JSON */
                }

                // Response body
                let resBody = '';
                try {
                    resBody = JSON.stringify(await response.json(), null, 2);
                } catch {
                    try {
                        resBody = await response.text();
                    } catch {
                        resBody = '<no body>';
                    }
                }
                if (resBody.length > maxBodyLength) {
                    resBody = resBody.slice(0, maxBodyLength) + '\n... (truncated)';
                }

                // نخفي التوكن
                const headers = { ...request.headers() };
                if (headers['authorization']) headers['authorization'] = '***';

                console.log(
                    [
                        '',
                        '='.repeat(80),
                        `${icon} ${request.method()} ${request.url()}`,
                        `Status: ${status} ${response.statusText()}`,
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

    // ============= Actions =============
    async openManualCampaigns() {
        await expect(this.manualCampaignsLink).toBeVisible();
        await this.manualCampaignsLink.click();
    }

    async clickCreateManualCampaign() {
        await expect(this.createManualCampaignButton).toBeVisible();
        await this.createManualCampaignButton.click();
    }

    async fillCampaignName(name: string) {
        await expect(this.campaignNameInput).toBeVisible();
        await this.campaignNameInput.fill(name);
    }

    async clickNext() {
        await expect(this.nextButton).toBeVisible();
        await expect(this.nextButton).toBeEnabled();
        await this.nextButton.click();
    }

    // لو مبعتش اسم: يختار أول جمهور متاح
    async selectAudience(audienceName?: string) {
        if (audienceName) {
            const byName = this.page.getByText(audienceName, { exact: true }).first();
            await expect(byName).toBeVisible({ timeout: 15000 });
            await byName.click();
            return audienceName;
        }

        const first = this.audienceCheckboxes.first();
        await expect(first).toBeAttached({ timeout: 15000 });
        await first.check({ force: true });
        return 'first available audience';
    }

    // يختار القالب بالاسم (الافتراضي: DEFAULT_TEMPLATE_NAME) ويرجّع اسمه
    async selectTemplate(
        templateName: string = ManualCampaignPage.DEFAULT_TEMPLATE_NAME
    ): Promise<string> {
        // استنى الخطوة تتحمل (القوالب غالبًا بتيجي من API)
        await this.page.waitForLoadState('networkidle').catch(() => { });

        try {
            // تأكد إن أزرار المعاينة ظهرت = إحنا فعلًا في خطوة القوالب
            await expect(this.templatePreviewButtons.first()).toBeVisible({ timeout: 20000 });
        } catch (e) {
            await this.page.screenshot({ path: 'debug-template-step.png', fullPage: true });
            throw e;
        }

        // الكارت اللي عنوانه (h3) = اسم القالب بالظبط (مش مجرد جزء منه)
        const escaped = templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const card = this.templateCards
            .filter({
                has: this.page.locator('h3', { hasText: new RegExp(`^\\s*${escaped}\\s*$`) }),
            })
            .first();

        await expect(
            card,
            `Template "${templateName}" was not found in the templates list`
        ).toBeVisible({ timeout: 15000 });

        // لو القالب بعيد في الليست، اسحب لحد ما يظهر
        await card.scrollIntoViewIfNeeded();

        const name = (await card.locator('h3').first().innerText()).trim();

        // اختيار القالب (لو في زر "اختيار" جوه الكارت بدّل السطر ده بالضغط عليه)
        await card.locator('h3').first().click();

        return name;
    }

    async clickCreateCampaign() {
        await expect(this.createCampaignButton).toBeVisible({ timeout: 20000 });
        await expect(this.createCampaignButton).toBeEnabled();
        await this.createCampaignButton.click();
    }

    // ============= Assertions =============
    async expectCampaignNameVisible() {
        await expect(this.campaignNameInput).toBeVisible();
    }

    async expectCreateCampaignVisible() {
        await expect(this.createCampaignButton).toBeVisible({ timeout: 20000 });
    }
}