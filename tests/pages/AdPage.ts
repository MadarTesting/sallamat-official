import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';

export class AdPage extends BasePage {

    // ============= Locators =============
    readonly adBoxLink: Locator;          // صندوق الإعلان (السيدبار)
    readonly createAdButton: Locator;     // إنشاء إعلان
    readonly firstOption: Locator;        // أول div جوه الـ main
    readonly nextStepButton: Locator;     // الخطوة القادمة
    readonly launchAdButton: Locator;     // إطلاق الإعلان
    readonly imageUploadArea: Locator;    // صورة الإعلان – نفس اللوكيتور main/div[1]
    readonly imageFileInput: Locator;     // الـ <input type="file"> بتاع "صورة الإعلان" جوه main/div[1]
    readonly imageDropZone: Locator;      // مربع "اضغط هنا لرفع الصورة" تحت "صورة الإعلان"

    // ============= Constructor =============
    constructor(page: Page) {
        super(page);

        this.adBoxLink = page.locator("//p[contains(text(),'صندوق الإعلان')]");
        this.createAdButton = page.locator("//button[contains(text(),'إنشاء إعلان')]");
        this.firstOption = page.locator(
            "//body/div[@dir='rtl']/main[@class='min-h-screen bg-primary-foreground']/div[1]"
        );
        this.nextStepButton = page.locator("//button[contains(text(),'الخطوة القادمة')]");
        this.launchAdButton = page.locator("//button[contains(text(),'إطلاق الإعلان')]");
        // رفع الصورة بيتم في نفس الإيلمنت main/div[1]
        this.imageUploadArea = this.firstOption;
        // في div[1] فيه مربعين رفع – المطلوب هو اللي تحت label "صورة الإعلان *"
        this.imageFileInput = this.imageUploadArea
            .locator("xpath=.//*[contains(text(),'صورة الإعلان')]/following::input[@type='file'][1]")
            .first();
        this.imageDropZone = this.imageUploadArea
            .locator("xpath=.//*[contains(text(),'صورة الإعلان')]/following::*[contains(text(),'اضغط هنا لرفع الصورة')][1]")
            .first();
    }

    // ============= Actions =============

    /** فتح صندوق الإعلان من السيدبار */
    async openAdBox() {
        await expect(this.adBoxLink).toBeVisible({ timeout: 15000 });
        await this.adBoxLink.click();
    }

    /** الضغط على إنشاء إعلان */
    async clickCreateAd() {
        await expect(this.createAdButton).toBeVisible({ timeout: 15000 });
        await this.createAdButton.click();
    }

    /** الضغط على أول div في الـ main */
    async selectFirstOption() {
        await expect(this.firstOption).toBeVisible({ timeout: 15000 });
        await this.firstOption.click();
    }

    /**
     * رفع صورة الإعلان في الإيلمنت main/div[1] (PNG/JPG، حتى 2MB، 800x600).
     * الرفع بيتم في مربع "صورة الإعلان *" (التاني) مش المربع الأول.
     * 1) لو في <input type="file"> بعد label "صورة الإعلان" ➜ نرفع عليه مباشرة.
     * 2) غير كده ➜ نضغط على مربع "اضغط هنا لرفع الصورة" اللي تحته ونستنى الـ File Chooser.
     */
    async uploadImage(filePath: string) {
        const absolutePath = path.resolve(filePath);
        await expect(this.imageUploadArea).toBeVisible({ timeout: 15000 });
        await expect(this.imageDropZone).toBeVisible({ timeout: 15000 });
        await this.imageDropZone.scrollIntoViewIfNeeded();

        if (await this.imageFileInput.count() > 0) {
            await this.imageFileInput.setInputFiles(absolutePath);
        } else {
            const [chooser] = await Promise.all([
                this.page.waitForEvent('filechooser', { timeout: 15000 }),
                this.imageDropZone.click(),
            ]);
            await chooser.setFiles(absolutePath);
        }

        // التأكد إن مربع "صورة الإعلان" اتملى (النص "اضغط هنا" اختفى)
        await expect(this.imageDropZone).toBeHidden({ timeout: 15000 }).catch(() => {
            console.log('⚠️  مربع صورة الإعلان لسه ظاهر – راجع إن الصورة اترفعت');
        });

        // استنى الصورة تترفع قبل "الخطوة القادمة"
        await this.page.waitForLoadState('networkidle').catch(() => {});
        console.log(`🖼️  Uploaded image: ${absolutePath}`);
    }

    /** الخطوة القادمة */
    async clickNextStep() {
        await expect(this.nextStepButton).toBeVisible({ timeout: 15000 });
        await expect(this.nextStepButton).toBeEnabled({ timeout: 15000 });
        await this.nextStepButton.click();
        // استنى الخطوة اللي بعدها تحمّل قبل الضغطة الجاية
        await this.page.waitForLoadState('networkidle').catch(() => {});
    }

    /** إطلاق الإعلان */
    async launchAd() {
        await expect(this.launchAdButton).toBeVisible({ timeout: 15000 });
        await expect(this.launchAdButton).toBeEnabled({ timeout: 15000 });
        await this.launchAdButton.click();
    }

    /**
     * Flow كامل:
     * صندوق الإعلان ➜ إنشاء إعلان ➜ div[1] ➜ رفع صورة في div[1] ➜
     * الخطوة القادمة ×4 ➜ إطلاق الإعلان
     */
    async createAd(imagePath = 'tests/assets/ad-image.png', nextSteps = 4) {
        await this.openAdBox();
        await this.clickCreateAd();

        await this.selectFirstOption();
        await this.uploadImage(imagePath);

        for (let i = 1; i <= nextSteps; i++) {
            console.log(`➡️  الخطوة القادمة (${i}/${nextSteps})`);
            await this.clickNextStep();
        }

        await this.launchAd();
    }
}
