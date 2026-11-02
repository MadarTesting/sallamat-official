export type Verdict = { ok: boolean; status: number; reason: string };

const KNOWN_ERRORS: Record<string, { status: number; reason: string }> = {
    CredentialsSignin: { status: 401, reason: 'Invalid email or password' },
    MissingCSRF: { status: 403, reason: 'Missing or invalid CSRF token' },
    AccessDenied: { status: 403, reason: 'Access denied' },
    Configuration: { status: 500, reason: 'Server auth configuration error' },
    Verification: { status: 400, reason: 'Verification failed or token expired' },
};

export function interpretAuth(httpStatus: number, text: string): Verdict {
    if (httpStatus >= 400) {
        return { ok: false, status: httpStatus, reason: `Server returned HTTP ${httpStatus}` };
    }

    let body: any;
    try {
        body = JSON.parse(text);
    } catch {
        return { ok: false, status: 500, reason: 'Response is not valid JSON' };
    }

    if (!body?.url) {
        return { ok: false, status: 500, reason: 'Response has no "url" field' };
    }

    const error = new URL(body.url, 'https://demo.sallamaat.com').searchParams.get('error');
    if (error) {
        const known = KNOWN_ERRORS[error];
        return known
            ? { ok: false, status: known.status, reason: `${known.reason} (error=${error})` }
            : { ok: false, status: 400, reason: `Login failed (error=${error})` };
    }

    return { ok: true, status: 200, reason: 'Login successful' };
}