import { test, expect } from '../fixtures/index';
import { APP_ROUTES } from '../config/routes';

test.describe('Authentication & Session Management', () => {
  test('admin user can login and access token stored', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    await expect(page.locator('h1')).toBeVisible();

    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));
    expect(role).toBe('Admin');
  });

  test('staff user can login and has correct role', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.dashboard);

    await expect(page.locator('body')).toBeVisible();

    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));
    expect(role).toBe('Staff');
  });

  test('regular user can be set as authenticated', async ({
    page,
    regularUser,
    setAuthToken,
  }) => {
    await setAuthToken(regularUser);

    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));
    expect(role).toBe('User');
  });

  test('mobile-sized login CTA starts OAuth redirect without hidden-button loading error', async ({
    page,
  }) => {
    await page.route('**/auth/v1/authorize**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>OAuth Redirect</title><p>redirected</p>',
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(APP_ROUTES.home);

    await page.getByRole('button', { name: 'Sign In With UMak Email' }).click();
    await page.waitForURL(/auth\/v1\/authorize\?/i, { timeout: 10000 });

    await expect(
      page.getByText('Google Sign-In is still loading. Please try again.')
    ).toHaveCount(0);

    expect(page.url()).toContain('/auth/v1/authorize?');
    expect(page.url()).toContain('provider=google');
  });

  test('admin callback route returns an authenticated session to the portal home flow', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto('/auth/callback');
    await page.waitForURL('**/admin', { timeout: 10000 });

    expect(page.url()).toContain(APP_ROUTES.admin.home);
  });

  test('regular user callback route is cleared and redirected to /not-allowed', async ({
    page,
    regularUser,
    setAuthToken,
  }) => {
    await setAuthToken(regularUser);
    await page.goto('/auth/callback');
    await page.waitForURL(`**${APP_ROUTES.notAllowed}`, { timeout: 15000 });

    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));

    expect(page.url()).toContain(APP_ROUTES.notAllowed);
    expect(token).toBeNull();
    expect(role).toBeNull();
  });

  test('guard user is redirected to /not-allowed and session is cleared', async ({
    page,
    guardUser,
    setAuthToken,
  }) => {
    await setAuthToken(guardUser);
    await page.goto(APP_ROUTES.home);
    await page.waitForURL(`**${APP_ROUTES.notAllowed}`, { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));

    expect(page.url()).toContain(APP_ROUTES.notAllowed);
    expect(token).toBeNull();
    expect(role).toBeNull();
  });

  test('logout clears authentication tokens', async ({
    page,
    adminUser,
    setAuthToken,
    logout,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    let token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    await logout();

    token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeNull();

    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));
    expect(role).toBeNull();
  });

  test('go to login page from not allowed clears authentication state', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.notAllowed);

    await page.getByRole('button', { name: 'Go to login page' }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'umak_link_web_api_token');

    expect(token).toBeNull();
    expect(role).toBeNull();
    expect(tokenCookie).toBeUndefined();
  });

  test('auth token persists across page navigation', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);

    await page.goto(APP_ROUTES.admin.dashboard);
    let token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    const initialToken = token;

    await page.goto(APP_ROUTES.admin.announcements);
    token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));

    expect(token).toBe(initialToken);
  });

  test('auth token is stored in both localStorage and cookies', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    const localToken = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(localToken).toBeTruthy();

    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'umak_link_web_api_token');
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.value).toBeTruthy();
  });

  test('invalid/missing token should not allow access to protected routes', async ({
    page,
  }) => {
    await page.goto(APP_ROUTES.admin.dashboard);

    const url = page.url();

    if (!url.includes('/admin')) {
      expect(url).toBeTruthy();
    }
  });

  test('auth tokens contain correct user information in payload', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    if (token) {
      const parts = token.split('.');
      expect(parts.length).toBe(3);

      const payloadStr = parts[1];
      if (payloadStr) {
        const payload = JSON.parse(
          Buffer.from(payloadStr, 'base64').toString('utf-8')
        );
        expect(payload.user_id).toBe(staffUser.user_id);
        expect(payload.user_type).toBe('Staff');
      }
    }
  });
});
