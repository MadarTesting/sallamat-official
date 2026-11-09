import { test, expect, type APIRequestContext } from '@playwright/test';
import testData from '../../testdata/testdata.json';
import { sendAndLog } from '../../utils/apiLogger';
import { interpretAuth } from '../../utils/authResult';

const BASE_URL = 'https://demo.sallamaat.com';

async function getCsrfToken(request: APIRequestContext): Promise<string> {
    const url = `${BASE_URL}/api/auth/csrf`;
    const res = await sendAndLog('GET csrf', 'GET', url, undefined, () => request.get(url));
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.csrfToken).toBeTruthy();
    return body.csrfToken;
}

async function postLogin(request: APIRequestContext, label: string, form: Record<string, string>) {
    const url = `${BASE_URL}/api/auth/callback/credentials`;
    const res = await sendAndLog(
        label, 'POST', url, form,
        () => request.post(url, { headers: { 'X-Auth-Return-Redirect': '1', Origin: BASE_URL }, form }),
        interpretAuth,
    );
    const verdict = interpretAuth(res.status(), await res.text());
    return { res, verdict };
}

async function login(request: APIRequestContext, email: string, password: string) {
    const csrfToken = await getCsrfToken(request);
    return postLogin(request, 'POST login', { email, password, csrfToken, callbackUrl: '/home' });
}

async function getSession(request: APIRequestContext) {
    const url = `${BASE_URL}/api/auth/session`;
    const res = await sendAndLog('GET session', 'GET', url, undefined, () => request.get(url));
    expect(res.status()).toBe(200);
    return res.json();
}

test.describe('Login API', () => {
    test('GET csrf returns a token', async ({ request }) => {
        const token = await getCsrfToken(request);
        expect(token.length).toBeGreaterThan(10);
    });

    test('login with valid credentials succeeds', async ({ request }) => {
        const { verdict } = await login(request, testData.validUser.email, testData.validUser.password);
        expect(verdict.ok, `Login failed [${verdict.status}]: ${verdict.reason}`).toBe(true);
    });

    test('login with valid credentials creates an authenticated session', async ({ request }) => {
        const { verdict } = await login(request, testData.validUser.email, testData.validUser.password);
        expect(verdict.ok, `Login failed [${verdict.status}]: ${verdict.reason}`).toBe(true);

        const session = await getSession(request);
        expect(session?.user, 'No user in session after login').toBeDefined();
    });

    test('login with wrong password fails with 401', async ({ request }) => {
        const { verdict } = await login(request, testData.invalidUser.email, testData.invalidUser.password);
        expect(verdict.ok, 'Login should have failed but succeeded').toBe(false);
        expect(verdict.status, verdict.reason).toBe(401);

        const session = await getSession(request);
        expect(session?.user, 'Session was created despite wrong password').toBeUndefined();
    });

    test('login without csrf token is rejected', async ({ request }) => {
        const { verdict } = await postLogin(request, 'POST login (no csrf)', {
            email: testData.validUser.email,
            password: testData.validUser.password,
            callbackUrl: '/home',
        });
        expect(verdict.ok, 'Login should have been rejected').toBe(false);
        expect(verdict.status, verdict.reason).toBeGreaterThanOrEqual(400);
    });

    test('login with empty fields fails', async ({ request }) => {
        const { verdict } = await login(request, '', '');
        expect(verdict.ok, 'Login should have failed with empty fields').toBe(false);
        expect(verdict.status, verdict.reason).toBeGreaterThanOrEqual(400);
    });
});