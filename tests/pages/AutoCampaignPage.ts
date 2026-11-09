import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AutoCampaignPage extends BasePage {

    // القالب اللي بيتختار دايمًا
    static readonly DEFAULT_TEMPLATE_NAME = 'fffffffffffff';

    // ============= Locators =============
    readonly autoCampaignsLink: Locator;       // الحملات التلقائية (السيدبار)
    readonly createAutoCampaignButton: Locator; // إنشاء حملة تلقائية
    readonly nameInput: Locator;               // اسم الحملة
    readonly descriptionInput: Locator;        // وصف الحملة
    readonly optionItem: Locator;              // العنصر (p) اللي بنضغط عليه بعد الوصف
    readonly nextButton: Locator;              // التالي
    readonly activateCampaignButton: Locator;  // تفعيل الحملة

    // ============= Constructor =============
    constructor(page: Page) {
        super(page);

        this.autoCampaignsLink = page.locator("//p[contains(text(),'الحملات التلقائية')]");
        this.createAutoCampaignButton = page.locator("//span[contains(text(),'إنشاء حملة تلقائية')]");
        this.nameInput = page.locator("//input[@id='name-input']");
        this.descriptionInput = page.locator("//input[@id='description-input']");
        this.optionItem = page.locator(
            "//p[@class='duration-200 ease-in-out text-sm max-sm:text-xs font-normal transition-colors text-black group-hover:text-gray-900']"
        ).first();
        this.nextButton = page.locator("//button[contains(text(),'التالي')]");
        this.activateCampaignButton = page.locator("//button[contains(text(),'تفعيل الحملة')]");
    }

    /** عنوان القالب h3 بالاسم بالظبط */
    templateTitle(name: string): Locator {
        return this.page.locator(`//h3[normalize-space()='${name}']`).first();
    }

    /** الشيك بوكس اللي في نفس كارت القالب (أقرب أب فيه checkbox) */
    templateCheckbox(name: string): Locator {
        return this.page
            .locator(
                `//h3[normalize-space()='${name}']` +
                `/ancestor::*[.//input[@type='checkbox'] or .//*[@role='checkbox']][1]` +
                `//*[self::input[@type='checkbox'] or @role='checkbox']`
            )
            .first();
    }

    // ============= Actions =============

    /** فتح الحملات التلقائية من السيدبار */
    async openAutoCampaigns() {
        await expect(this.autoCampaignsLink).toBeVisible({ timeout: 15000 });
        await this.autoCampaignsLink.click();
    }

    /** الضغط على إنشاء حملة تلقائية */
    async clickCreateAutoCampaign() {
        await expect(this.createAutoCampaignButton).toBeVisible({ timeout: 15000 });
        await this.createAutoCampaignButton.click();
    }

    /** كتابة اسم الحملة */
    async fillName(name: string) {
        await expect(this.nameInput).toBeVisible({ timeout: 15000 });
        await this.nameInput.fill(name);
        await expect(this.nameInput).toHaveValue(name);
    }

    /** كتابة وصف الحملة */
    async fillDescription(description: string) {
        await expect(this.descriptionInput).toBeVisible({ timeout: 15000 });
        await this.descriptionInput.fill(description);
        await expect(this.descriptionInput).toHaveValue(description);
    }

    /** الضغط على العنصر (p) */
    async selectOption() {
        await expect(this.optionItem).toBeVisible({ timeout: 15000 });
        await this.optionItem.click();
    }

    /**
     * اختيار القالب (دايمًا fffffffffffff):
     * بيدوّر على الـ h3 ويضغط عليه، وبعدين يعلّم على الشيك بوكس لو مش متعلّم.
     */
    async selectTemplate(name: string = AutoCampaignPage.DEFAULT_TEMPLATE_NAME): Promise<string> {
        await this.page.waitForLoadState('networkidle').catch(() => {});

        const title = this.templateTitle(name);
        await expect(title, `Template "${name}" was not found`).toBeVisible({ timeout: 20000 });
        await title.scrollIntoViewIfNeeded();
        await title.click();

        const checkbox = this.templateCheckbox(name);
        if (await checkbox.count() > 0) {
            const isChecked = async () =>
                (await checkbox.getAttribute('aria-checked')) === 'true' ||
                (await checkbox.getAttribute('data-state')) === 'checked' ||
                (await checkbox.evaluate((el) => (el as HTMLInputElement).checked === true));

            // الضغط على الـ h3 ممكن يكون علّم عليه بالفعل
            if (!(await isChecked())) {
                await checkbox.click({ force: true });
            }
            await expect.poll(isChecked, { message: `Checkbox of "${name}" is not checked` }).toBe(true);
        } else {
            console.log(`⚠️  مفيش checkbox ظاهر في كارت "${name}" – اتعمل اختيار بالضغط على العنوان بس`);
        }

        console.log(`✅ Selected template: ${name}`);
        return name;
    }

    /** التالي */
    async clickNext() {
        await expect(this.nextButton).toBeVisible({ timeout: 15000 });
        await expect(this.nextButton).toBeEnabled({ timeout: 15000 });
        await this.nextButton.click();
        await this.page.waitForLoadState('networkidle').catch(() => {});
    }

    /** تفعيل الحملة */
    async activateCampaign() {
        await expect(this.activateCampaignButton).toBeVisible({ timeout: 15000 });
        await expect(this.activateCampaignButton).toBeEnabled({ timeout: 15000 });
        await this.activateCampaignButton.click();
    }

    /**
     * Flow كامل:
     * الحملات التلقائية ➜ إنشاء حملة تلقائية ➜ الاسم ➜ الوصف ➜ الحدث (p) ➜ التالي ➜
     * القالب fffffffffffff + الشيك بوكس ➜ (التالي لو موجود) ➜ تفعيل الحملة
     */
    async createAutoCampaign(options: {
        name?: string;
        description?: string;
        templateName?: string;
    } = {}) {
        const {
            name = `Auto Campaign ${Date.now()}_${Math.floor(Math.random() * 9999)}`,
            description = 'Automated auto-campaign description',
            templateName = AutoCampaignPage.DEFAULT_TEMPLATE_NAME,
        } = options;

        await this.openAutoCampaigns();
        await this.clickCreateAutoCampaign();
        await this.fillName(name);
        await this.fillDescription(description);
        // الحدث: "تم إنشاء عميل" ➜ التالي (القوالب في الخطوة اللي بعدها)
        await this.selectOption();
        await this.clickNext();

        // اختيار القالب + الشيك بوكس
        await this.selectTemplate(templateName);

        // لو "تفعيل الحملة" مش ظاهر لسه، نضغط التالي كمان مرة
        if (!(await this.activateCampaignButton.isVisible()) && (await this.nextButton.isVisible())) {
            await this.clickNext();
        }
        await this.activateCampaign();

        return { name, description, templateName };
    }
}
