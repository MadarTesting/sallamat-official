import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
    //============= variables =============
    readonly url = 'https://demo.sallamaat.com/auth?step=login';

    //============= locators ==============
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    //============= constructor ===========
    constructor(page: Page) {
        super(page);
        this.emailInput = page.locator("//input[@id='email-input']");
        this.passwordInput = page.locator("//input[@id='password-password']");
        this.loginButton = page.getByRole('button', { name: 'تسجيل الدخول' });
    }

    //============= actions ===============
    async goto() {
        await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    }

    async fillEmail(email: string) {
        await this.emailInput.fill(email);
    }

    async fillPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    async clickLogin() {
        await this.loginButton.click();
    }

    async login(email: string, password: string) {
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.clickLogin();
    }

    //============= assertions ============
    async expectLoginFormVisible() {
        await expect(this.emailInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }

    // نجاح اللوجين = اختفاء فورم اللوجين (مش بنعتمد على شكل الـ URL)
    async expectLoggedIn() {
        await expect(this.emailInput).toBeHidden({ timeout: 15000 });
        await expect(this.loginButton).toBeHidden({ timeout: 15000 });
    }

    async expectStillOnLogin() {
        await expect(this.page).toHaveURL(/auth/);
        await expect(this.emailInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }
}