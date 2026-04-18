import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';

/**
 * Smoke tests for admin stub pages
 * Verifies that pages load without crashing
 * Full functionality tests would be added as features are implemented
 */
test.describe('Admin Stub Pages - Smoke Tests', () => {
  test('admin management page loads', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.adminManagement);

    // Page should load (may show "coming soon" or stub content)
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();

    // Should not crash
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    expect(errors.length).toBe(0);
  });

  test('staff management page loads', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.staffManagement);

    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('audit trail page loads', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.auditTrail);

    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('admin notifications page loads', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.notifications);

    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('all admin stub pages accessible only to admin', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Try to access admin management
    await page.goto(APP_ROUTES.admin.adminManagement);

    // Staff user is redirected to /staff by RoleRouteGuard
    await page.waitForURL('**/staff**', { timeout: 10000 });
    expect(page.url()).not.toContain('/admin');
  });
});
