import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';

// RoleRouteGuard does a client-side redirect after /auth/me resolves.
// Tests must waitForURL to let that async redirect complete before asserting.

test.describe('Role-Based Access Control', () => {
  test('admin user can access /admin/dashboard', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admin');
  });

  test('staff user is redirected to /not-allowed from /admin/dashboard', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    // RoleRouteGuard redirects authenticated users without access to /not-allowed.
    await page.waitForURL(`**${APP_ROUTES.notAllowed}`, { timeout: 10000 });
    expect(page.url()).toContain(APP_ROUTES.notAllowed);
  });

  test('regular user is redirected away from admin routes', async ({
    page,
    regularUser,
    setAuthToken,
  }) => {
    await setAuthToken(regularUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    // User tokens fail isPortalRoleToken() → getStoredToken() returns null
    // → RoleRouteGuard sees no user → redirects to "/"
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    expect(page.url()).not.toContain('/admin');
  });

  test('staff user can access /staff routes', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.dashboard);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/staff');
  });

  test('admin user is redirected to /not-allowed from /staff routes', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.staff.dashboard);

    // RoleRouteGuard redirects authenticated users without access to /not-allowed.
    await page.waitForURL(`**${APP_ROUTES.notAllowed}`, { timeout: 10000 });
    expect(page.url()).toContain(APP_ROUTES.notAllowed);
  });

  test('regular user cannot access /staff routes', async ({
    page,
    regularUser,
    setAuthToken,
  }) => {
    await setAuthToken(regularUser);
    await page.goto(APP_ROUTES.staff.dashboard);

    // Same as admin: User token is rejected → redirected to "/"
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    expect(page.url()).not.toContain('/staff');
  });

  test('unauthenticated user is redirected to home from admin routes', async ({
    page,
  }) => {
    // No token set — RoleRouteGuard redirects to "/" when user is null
    await page.goto(APP_ROUTES.admin.dashboard);
    await page.waitForURL('**/', { timeout: 10000 });

    expect(page.url()).not.toContain('/admin');
  });
});

test.describe('Auth State Persistence', () => {
  test('session persists after page reload', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);
    await page.waitForLoadState('networkidle');

    const tokenBefore = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));

    await page.reload();
    await page.waitForLoadState('networkidle');

    const tokenAfter = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(tokenAfter).toBe(tokenBefore);
    expect(tokenAfter).toBeTruthy();
  });

  test('auth state clears after logout', async ({
    page,
    adminUser,
    setAuthToken,
    logout,
  }) => {
    await setAuthToken(adminUser);
    const token = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(token).toBeTruthy();

    await logout();

    const tokenAfter = await page.evaluate(() => localStorage.getItem('umak_link_web_api_token'));
    expect(tokenAfter).toBeNull();
  });
});

test.describe('Access Control - Additional Roles', () => {
  test('admin can access all admin routes', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admin');
  });

  test('staff can access staff routes', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.posts);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/staff');
  });
});
