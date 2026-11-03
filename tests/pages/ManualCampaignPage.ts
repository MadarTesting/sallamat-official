import { expect, type Locator, type Page } from '@playwright/test';

export class ManualCampaignPage {

    // ============= Variables =============
    readonly page: Page;

    // ============= Locators =============
    readonly manualCampaignsLink: Locator;
    readonly createManualCampaignButton: Locator;
    readonly campaignNameInput: Locator;
    readonly nextButton: Locator;
    readonly selectAudienceCheckbox: Locator;
    readonly templateCards: Locator;
    readonly createCampaignButton: Locator;

    // ============= Constructor =============
    constructor(page: Page) {
        this.page = page;

        this.manualCampaignsLink = page.locator(
            "//p[contains(text(),'الحملات اليدوية')]"
        );

        this.createManualCampaignButton = page.locator(
            "//span[contains(text(),'إنشاء حملة يدوية')]"
        );

        this.campaignNameInput = page.locator('#name-input');

        this.nextButton = page.getByRole('button', {
            name: 'التالي',
            exact: true
        });

        this.selectAudienceCheckbox = page.getByRole('checkbox').first();
        this.templateCards = page.locator(
            "//p[contains(text(),'يرجى اختيار قالب للحملة')]/following-sibling::div/*"
        ).or(page.locator("//button[contains(text(),'معاينة القالب')]/../.."));

        // زر إنشاء الحملة أو حفظ كمسودة في الخطوة النهائية
        this.createCampaignButton = page.getByRole('button', {
            name: /إنشاء الحملة|حفظ كمسودة/
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

    async selectAudience() {
        await expect(this.selectAudienceCheckbox).toBeVisible({
            timeout: 15000
        });
        await this.selectAudienceCheckbox.check();
    }

    async selectTemplate(templateName?: string) {
        const target = templateName
            ? this.templateCards.filter({ hasText: templateName }).first()
            : this.templateCards.first();

        await expect(target).toBeVisible({ timeout: 15000 });
        await target.click();
    }

    async clickCreateCampaign() {
        await expect(this.createCampaignButton).toBeVisible({
            timeout: 20000
        });
        await expect(this.createCampaignButton).toBeEnabled();
        await this.createCampaignButton.click();
    }

    // ============= Assertions =============

    async expectCampaignNameVisible() {
        await expect(this.campaignNameInput).toBeVisible();
    }

    async expectCreateCampaignVisible() {
        await expect(this.createCampaignButton).toBeVisible({
            timeout: 20000
        });
    }
}