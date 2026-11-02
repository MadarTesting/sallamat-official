import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/loginpage';
import testData from './testdata/testdata.json';

test.describe('Login', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('login page loads with title and form', async ({ page }) => {
        await expect(page).toHaveTitle(/سلامات/);
        await loginPage.expectLoginFormVisible();
    });

    test('login with valid credentials', async () => {
        await loginPage.login(testData.validUser.email, testData.validUser.password);
        await loginPage.expectLoggedIn();
    });

    test('login with wrong password stays on login page', async () => {
        await loginPage.login(testData.invalidUser.email, testData.invalidUser.password);
        await loginPage.expectStillOnLogin();
    });

    test('login with empty fields stays on login page', async () => {
        await loginPage.clickLogin();
        await loginPage.expectStillOnLogin();
    });
});