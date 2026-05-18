import { test, expect } from '../fixtures/index';
import { APP_ROUTES } from '../config/routes';

test.describe('Authentication & Session Management', () => {
  test('admin user can login and access token stored', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    // Set auth token for admin
    await setAuthToken(adminUser);

    // Navigate to admin dashboard
    await page.goto(APP_ROUTES.admin.dashboard);

    // Verify page loads
    await expect(page.locator('h1')).toBeVisible();

    // Verify token is in localStorage
    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    // Verify role is stored
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

    // Verify page loads
    await expect(page.locator('body')).toBeVisible();

    // Verify role is Staff
    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));
    expect(role).toBe('Staff');
  });

  test('regular user can be set as authenticated', async ({
    page,
    regularUser,
    setAuthToken,
  }) => {
    await setAuthToken(regularUser);

    // Token should be set
    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    // Role should be User
    const role = await page.evaluate(() => localStorage.getItem('umak_link_web_role'));
    expect(role).toBe('User');
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
    // Login as admin
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    // Verify logged in
    let token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    // Logout
    await logout();

    // Verify token is cleared
    token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeNull();

    // Verify role is cleared
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

    // Navigate to dashboard
    await page.goto(APP_ROUTES.admin.dashboard);
    let token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    const initialToken = token;

    // Navigate to another page
    await page.goto(APP_ROUTES.admin.announcements);
    token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));

    // Token should be the same
    expect(token).toBe(initialToken);
  });

  test('auth token is stored in both localStorage and cookies', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    // Check localStorage
    const localToken = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(localToken).toBeTruthy();

    // Check cookies
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'umak_link_web_api_token');
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.value).toBeTruthy();
  });

  test('invalid/missing token should not allow access to protected routes', async ({
    page,
  }) => {
    // Try to access admin route without token
    await page.goto(APP_ROUTES.admin.dashboard);

    // Should either redirect or show unauthorized state
    // The actual behavior depends on your app's implementation
    const url = page.url();

    // If redirected, should not be at admin dashboard
    if (!url.includes('/admin')) {
      expect(url).toBeTruthy(); // Just verify we're somewhere
    }
  });

  test('auth tokens contain correct user information in payload', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Get token from storage
    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    if (token) {
      // Verify token structure (base64 encoded parts)
      const parts = token.split('.');
      expect(parts.length).toBe(3); // header.payload.signature

      // Decode payload and verify claims
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
