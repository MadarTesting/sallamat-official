import { expect, type Locator, type Page } from '@playwright/test';

export class ManualCampaignPage {
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

    // لو مبعتش اسم: يختار أول قالب متاح ويرجّع اسمه
    async selectTemplate(templateName?: string): Promise<string> {
        // استنى الخطوة تتحمل (القوالب غالبًا بتيجي من API)
        await this.page.waitForLoadState('networkidle').catch(() => { });

        try {
            // أول حاجة: تأكد إن أزرار المعاينة ظهرت = إحنا فعلًا في خطوة القوالب
            await expect(this.templatePreviewButtons.first()).toBeVisible({ timeout: 20000 });
        } catch (e) {
            // لقطة شاشة للمساعدة في معرفة المشكلة لو الخطوة مفتحتش
            await this.page.screenshot({ path: 'debug-template-step.png', fullPage: true });
            throw e;
        }

        const cards = templateName
            ? this.templateCards.filter({ hasText: templateName })
            : this.templateCards;

        const card = cards.first();
        await expect(card).toBeVisible({ timeout: 15000 });

        const title = card.locator('h3').first();
        const name = (await title.innerText()).trim();

        // اختيار القالب (لو في زر "اختيار" جوه الكارت بدّل السطر ده بالضغط عليه)
        await title.click();

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