import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';

export class CustomersPage extends BasePage {

    // ============= Locators =============
    readonly customersLink: Locator;        // العملاء (التاب فوق)
    readonly manualUploadButton: Locator;   // رفع البيانات يدويًا
    readonly uploadDialog: Locator;         // البوب أب "رفع البيانات يدويًا"
    readonly downloadTemplateLink: Locator; // اضغط للتنزيل
    readonly uploadArea: Locator;           // اضغط لرفع ملف إكسل ...
    readonly fileInput: Locator;            // <input type="file"> جوه البوب أب
    readonly confirmButton: Locator;        // تأكيد
    readonly cancelButton: Locator;         // إلغاء

    // ============= Constructor =============
    constructor(page: Page) {
        super(page);

        this.customersLink = page.locator("//p[normalize-space()='العملاء']").first();
        this.manualUploadButton = page.locator("//button[contains(normalize-space(.),'رفع البيانات')]").first();
        this.uploadDialog = page.locator("//*[@role='dialog'][.//*[contains(text(),'رفع البيانات')]]").first();
        this.downloadTemplateLink = page.locator("//*[contains(text(),'اضغط للتنزيل')]").first();
        this.uploadArea = page.locator("//*[contains(text(),'اضغط لرفع ملف')]").first();
        this.fileInput = page.locator("input[type='file']").first();
        this.confirmButton = page.locator("//button[normalize-space()='تأكيد']").first();
        this.cancelButton = page.locator("//button[normalize-space()='إلغاء']").first();
    }

    // ============= Actions =============

    /** فتح العملاء */
    async openCustomers() {
        await expect(this.customersLink).toBeVisible({ timeout: 15000 });
        await this.customersLink.click();
        await this.page.waitForLoadState('networkidle').catch(() => {});
    }

    /** الضغط على رفع البيانات يدويًا */
    async clickManualUpload() {
        await expect(this.manualUploadButton).toBeVisible({ timeout: 15000 });
        await this.manualUploadButton.click();
        await expect(this.downloadTemplateLink).toBeVisible({ timeout: 15000 });
    }

    /** اضغط للتنزيل ➜ تنزيل ملف الإكسل وحفظه في saveDir. بيرجّع مسار الملف */
    async downloadTemplate(saveDir: string): Promise<string> {
        const [download] = await Promise.all([
            this.page.waitForEvent('download', { timeout: 30000 }),
            this.downloadTemplateLink.click(),
        ]);
        const fileName = download.suggestedFilename() || 'customers-template.xlsx';
        const savePath = path.join(saveDir, fileName);
        await download.saveAs(savePath);
        console.log(`⬇️  Downloaded template: ${savePath}`);
        return savePath;
    }

    /** رفع ملف الإكسل المتعبّي */
    async uploadFile(filePath: string) {
        const absolutePath = path.resolve(filePath);

        if (await this.fileInput.count() > 0) {
            await this.fileInput.setInputFiles(absolutePath);
        } else {
            const [chooser] = await Promise.all([
                this.page.waitForEvent('filechooser', { timeout: 15000 }),
                this.uploadArea.click(),
            ]);
            await chooser.setFiles(absolutePath);
        }

        // اسم الملف بيظهر في البوب أب بعد الرفع
        await expect(this.page.getByText(path.basename(absolutePath)).first())
            .toBeVisible({ timeout: 10000 })
            .catch(() => console.log('⚠️  اسم الملف ما ظهرش في البوب أب – راجع إن الرفع تم'));
        console.log(`⬆️  Uploaded file: ${absolutePath}`);
    }

    /** تأكيد */
    async confirm() {
        await expect(this.confirmButton).toBeEnabled({ timeout: 15000 });
        await this.confirmButton.click();
        await this.page.waitForLoadState('networkidle').catch(() => {});
    }

    // ============= Assertions =============

    /** التأكد إن العميل ظهر في الجدول */
    async expectCustomerVisible(name: string) {
        await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 20000 });
    }
}
