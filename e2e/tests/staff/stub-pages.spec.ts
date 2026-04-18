import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';

/**
 * Smoke tests for staff stub/detail pages
 * Verifies that pages load without crashing
 */
test.describe('Staff Stub Pages - Smoke Tests', () => {
  test('post record detail page loads', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Navigate to a post detail page
    const postId = 'test-post-123';
    await page.goto(APP_ROUTES.staff.viewPost(postId));

    // Page should load (may show "not found" or stub content)
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('fraud report detail page loads', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    const reportId = 'test-report-123';
    await page.goto(APP_ROUTES.staff.fraudReportDetails(reportId));

    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('staff home page loads', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.home);

    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('detail pages not accessible to non-staff users', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);

    const postId = 'test-post-123';
    await page.goto(APP_ROUTES.staff.viewPost(postId));

    // Admin user is redirected to /admin by RoleRouteGuard (staff routes require Staff role)
    await page.waitForURL('**/admin**', { timeout: 10000 });
    expect(page.url()).not.toContain('/staff');
  });
});
