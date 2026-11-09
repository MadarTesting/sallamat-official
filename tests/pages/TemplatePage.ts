import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';

export type AttachmentType = 'image' | 'file' | 'video' | 'none';

export class TemplatePage extends BasePage {

    // ============= Locators =============
    // Navigation
    readonly templatesLink: Locator;
    readonly createTemplateButton: Locator;

    // Setup fields
    readonly templateNameInput: Locator;
    readonly messageBodyTextarea: Locator;    // نص الرسالة (content-textarea)
    readonly headerTextInput: Locator;        // نص الهيدر (يظهر بعد اختيار "نص")
    readonly footerTextInput: Locator;

    // التوجل (تفعيل تلقائي / Auto-send toggle)
    // value='on' = الزر اللي لازم نضغطه عشان نفعّله
    readonly toggle: Locator;

    // Attachment type selector buttons (نص | صورة | فيديو | ملف)
    readonly textButton: Locator;
    readonly imageButton: Locator;
    readonly videoButton: Locator;
    readonly fileButton: Locator;

    // File input (hidden <input type="file">)
    readonly fileInput: Locator;

    // Submit – "إرسال للمراجعة"
    readonly submitButton: Locator;

    // ============= Constructor =============
    constructor(page: Page) {
        super(page);

        // القوالب في السيدبار
        this.templatesLink = page.locator("//p[contains(text(),'القوالب')]");

        // زر إنشاء قالب جديد (النص داخله "text-sm font-semibold")
        this.createTemplateButton = page.locator("//span[@class='text-sm font-semibold']");

        // حقل اسم القالب
        this.templateNameInput = page.locator("//input[@id='name-input']");

        // حقل نص الرسالة (المحتوى)
        this.messageBodyTextarea = page.locator("//textarea[@id='content-textarea']");

        // حقل نص الهيدر (يظهر لما نختار نوع "نص")
        this.headerTextInput = page.locator("//input[@id='header_text-input']");

        // حقل الفوتر
        this.footerTextInput = page.locator("//input[@id='footer_text-input']");

        // التوجل – الزر اللي value بتاعته 'on'
        this.toggle = page.locator("//button[@value='on']").first();

        // أزرار نوع المرفق بالترتيب الظاهر في الصفحة (RTL)
        // نص | صورة | فيديو | ملف
        this.textButton = page.locator("//button[normalize-space(text())='نص']");
        this.imageButton = page.locator("//button[contains(text(),'صورة')]");
        this.videoButton = page.locator("//button[contains(text(),'فيديو')]");
        this.fileButton = page.locator("//button[normalize-space(text())='ملف']");

        // الـ <input type="file"> المخفي (setInputFiles يشتغل حتى لو مخفي)
        this.fileInput = page.locator("input[type='file']");

        // زر "إرسال للمراجعة"
        this.submitButton = page.locator(
            "//button[contains(normalize-space(.),'إرسال للمراجعة')]"
        );
    }

    // ============= Actions =============

    /** التنقل لصفحة القوالب */
    async openTemplates() {
        await expect(this.templatesLink).toBeVisible({ timeout: 15000 });
        await this.templatesLink.click();
    }

    /** الضغط على إنشاء قالب جديد */
    async clickCreateTemplate() {
        await expect(this.createTemplateButton).toBeVisible({ timeout: 15000 });
        await this.createTemplateButton.click();
    }

    /** كتابة اسم القالب */
    async fillTemplateName(name: string) {
        await expect(this.templateNameInput).toBeVisible({ timeout: 15000 });
        await this.templateNameInput.fill(name);
    }

    /** كتابة نص الهيدر (header_text-input) */
    async fillHeaderText(header: string) {
        await expect(this.headerTextInput).toBeVisible({ timeout: 10000 });
        await this.headerTextInput.fill(header);
        await expect(this.headerTextInput).toHaveValue(header);
    }

    /** كتابة نص الفوتر */
    async fillFooterText(footer: string) {
        await expect(this.footerTextInput).toBeVisible({ timeout: 10000 });
        await this.footerTextInput.fill(footer);
    }

    /** كتابة نص الرسالة في content-textarea */
    async fillMessageBody(body: string) {
        await expect(this.messageBodyTextarea).toBeVisible({ timeout: 10000 });
        await this.messageBodyTextarea.fill(body);
        await expect(this.messageBodyTextarea).toHaveValue(body);
    }

    /**
     * تفعيل التوجل (التفعيل التلقائي).
     * لو التوجل متفعّل بالفعل (aria-checked=true أو data-state=checked) ما بنضغطش تاني.
     */
    async activateToggle() {
        await expect(this.toggle).toBeVisible({ timeout: 10000 });

        const isAlreadyOn =
            (await this.toggle.getAttribute('aria-checked')) === 'true' ||
            (await this.toggle.getAttribute('data-state')) === 'checked';

        if (!isAlreadyOn) {
            await this.toggle.click();
        }
    }

    /**
     * اختيار نوع المرفق + رفع الملف لو موجود.
     * - 'none'  → نص فقط (بدون مرفق)
     * - 'image' → صورة
     * - 'video' → فيديو
     * - 'file'  → ملف (PDF/document)
     */
    async selectAttachmentType(type: AttachmentType, filePath?: string) {
        switch (type) {
            case 'none':
                await expect(this.textButton).toBeVisible({ timeout: 10000 });
                await this.textButton.click();
                return; // بدون رفع ملف

            case 'image':
                await expect(this.imageButton).toBeVisible({ timeout: 10000 });
                await this.imageButton.click();
                break;

            case 'video':
                await expect(this.videoButton).toBeVisible({ timeout: 10000 });
                await this.videoButton.click();
                break;

            case 'file':
                await expect(this.fileButton).toBeVisible({ timeout: 10000 });
                await this.fileButton.click();
                break;
        }

        // بعد اختيار النوع، لو في ملف يتحمل
        if (filePath) {
            await this.uploadFile(filePath);
        }
    }

    /** رفع ملف عبر الـ <input type="file"> المخفي */
    async uploadFile(filePath: string) {
        const absolutePath = path.resolve(filePath);
        await this.fileInput.setInputFiles(absolutePath);
    }

    /** إرسال للمراجعة */
    async submitTemplate() {
        await expect(this.submitButton).toBeVisible({ timeout: 10000 });
        await expect(this.submitButton).toBeEnabled();
        await this.submitButton.click();
    }

    /**
     * Flow كامل:
     * فتح القوالب ➜ إنشاء ➜ كتابة الاسم ➜ تفعيل التوجل ➜
     * اختيار نوع المرفق ➜ رفع الملف (لو موجود) ➜ كتابة المحتوى ➜ كتابة الفوتر
     *
     * @param name      اسم القالب (يتولّد أوتوماتيك لو ما بعتش)
     * @param header    نص الهيدر (header_text-input) – بيتملى في حالة 'none' (نص)
     * @param body      نص الرسالة (content-textarea)
     * @param footer    نص الفوتر
     * @param type      نوع المرفق: 'image' | 'file' | 'video' | 'none'
     * @param filePath  مسار الملف (مطلوب لـ image/file/video)
     */
    async createTemplate(options: {
        name?: string;
        header?: string;
        body?: string;
        footer?: string;
        type: AttachmentType;
        filePath?: string;
    }) {
        const {
            name = `Auto Template ${Date.now()}_${Math.floor(Math.random() * 9999)}`,
            header = 'Automated Header',
            body = 'Automated template content',
            footer = 'Automated footer',
            type,
            filePath,
        } = options;

        await this.openTemplates();
        await this.clickCreateTemplate();
        await this.fillTemplateName(name);

        // تفعيل التوجل قبل اختيار نوع المرفق
        await this.activateToggle();

        // اختيار النوع + رفع الملف
        await this.selectAttachmentType(type, filePath);

        // في حالة "نص" لازم نملى حقل الهيدر قبل الإرسال
        if (type === 'none') {
            await this.fillHeaderText(header);
        }

        // كتابة المحتوى في content-textarea
        await this.fillMessageBody(body);

        // كتابة الفوتر
        await this.fillFooterText(footer);

        return { name, header, body, footer, type };
    }

    // ============= Assertions =============

    async expectTemplateNameVisible() {
        await expect(this.templateNameInput).toBeVisible();
    }

    async expectSubmitVisible() {
        await expect(this.submitButton).toBeVisible({ timeout: 10000 });
    }
}
