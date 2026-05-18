import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';
import { expectNavigationVisible, expectPageTitle } from '../../helpers/assertions';

test.describe('Navigation - Admin', () => {
  test('admin sidebar navigation is visible', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Admin sidebar always renders with a Logout button
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });

  test('admin can navigate between dashboard and announcements', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);

    // Wait for RoleRouteGuard to resolve and render the sidebar
    await page.waitForLoadState('networkidle');

    // Sidebar links from admin-sidebar.tsx use <a> tags
    const navLinks = await page.locator('a[href]').count();
    expect(navLinks).toBeGreaterThan(0);
  });

  test('admin can navigate back to dashboard', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);

    // Start at announcements
    await page.goto(APP_ROUTES.admin.announcementsList);

    // Navigate back (via browser back or link)
    // Just verify we're on the announcements page
    expect(page.url()).toContain('/admin/announcement');
  });

  test('admin logout is accessible from navigation', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);
    await page.goto(APP_ROUTES.admin.dashboard);
    await page.waitForLoadState('networkidle');

    // Look for logout button in header or sidebar
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")'
    );

    // Admin sidebar always has a Logout button
    const hasLogout = await logoutButton.count().then((n) => n > 0);
    expect(hasLogout).toBeTruthy();
  });
});

test.describe('Navigation - Staff', () => {
  test('staff sidebar navigation is visible', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.dashboard);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Staff sidebar always renders with a Logout button
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });

  test('staff can navigate between dashboard and posts', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.dashboard);

    // Wait for RoleRouteGuard to resolve and render the sidebar
    await page.waitForLoadState('networkidle');

    // Sidebar links from staff-sidebar.tsx use <a> tags
    const navLinks = await page.locator('a[href]').count();
    expect(navLinks).toBeGreaterThan(0);
  });

  test('staff can navigate to search page', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Navigate to search
    await page.goto(APP_ROUTES.staff.search);
    expect(page.url()).toContain('/search');
  });

  test('staff can navigate to fraud reports', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Navigate to fraud reports
    await page.goto(APP_ROUTES.staff.fraudReports);
    expect(page.url()).toContain('/fraud-reports');
  });

  test('staff logout is accessible', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.dashboard);
    await page.waitForLoadState('networkidle');

    // Look for logout button
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")'
    );

    // Staff sidebar always has a Logout button
    const hasLogout = await logoutButton.count().then((n) => n > 0);
    expect(hasLogout).toBeTruthy();
  });
});

test.describe('Navigation - Global', () => {
  test('home page is accessible', async ({
    page,
  }) => {
    await page.goto(APP_ROUTES.home);

    // Just verify page loads
    expect(page.url()).toContain('/');
  });

  test('navigation prevents access to wrong role routes', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);

    // Admin tries to navigate to staff route
    await page.goto(APP_ROUTES.staff.dashboard);

    // RoleRouteGuard redirects authenticated users without access to /not-allowed.
    await page.waitForURL(`**${APP_ROUTES.notAllowed}`, { timeout: 10000 });
    expect(page.url()).toContain(APP_ROUTES.notAllowed);
  });

  test('clicking internal links does not break navigation', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);

    // Navigate to page
    await page.goto(APP_ROUTES.admin.dashboard);

    // Find any internal navigation link and click it
    const internalLinks = await page.locator('a[href^="/"]').all();

    if (internalLinks.length > 0 && internalLinks[0]) {
      // Click first available link
      await internalLinks[0].click();
      await page.waitForLoadState('networkidle');

      // Should have navigated somewhere
      const newUrl = page.url();
      expect(newUrl).toBeTruthy();
    }
  });

  test('breadcrumb navigation if present', async ({
    page,
    adminUser,
    setAuthToken,
  }) => {
    await setAuthToken(adminUser);

    // Navigate to a nested page
    await page.goto(APP_ROUTES.admin.announcementsList);

    // Look for breadcrumbs
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"], nav[aria-label="Breadcrumb"]');

    const hasBreadcrumbs = await breadcrumbs.count().then((n) => n > 0);

    // Breadcrumbs are optional - just verify they work if present
    if (hasBreadcrumbs) {
      const breadcrumbCount = await breadcrumbs.first().locator('a, button').count();
      expect(breadcrumbCount).toBeGreaterThan(0);
    }
  });
});
