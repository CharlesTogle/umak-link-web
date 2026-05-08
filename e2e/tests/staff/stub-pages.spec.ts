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

  test('post record detail falls back to base post when full details are unavailable', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    const postId = '1817';
    await page.route(`**/posts/${postId}/full`, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Error',
          message: 'Post not found',
          statusCode: 500,
        }),
      });
    });
    await page.route(`**/posts/${postId}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          post_id: 1817,
          item_id: 'item-1817',
          poster_name: 'Seed User 139',
          poster_id: 'staff-001',
          poster_profile_picture_url: null,
          item_name: 'Gray Pocketed Everyday USB Flash Drive',
          item_description: 'Fallback record from base post endpoint',
          item_type: 'missing',
          item_image_url: 'https://via.placeholder.com/300x300',
          category: 'Electronics',
          last_seen_at: '2026-05-05T12:00:00+08:00',
          last_seen_location: 'Academic Building 3 > 1 Floor > Not Applicable',
          submission_date: '2026-05-07T12:00:00+08:00',
          post_status: 'accepted',
          item_status: 'lost',
          is_anonymous: false,
          accepted_on_date: '2026-05-07T14:00:00+08:00',
        }),
      });
    });

    await page.goto(APP_ROUTES.staff.viewPost(postId));
    await expect(page.getByText('Gray Pocketed Everyday USB Flash Drive')).toBeVisible();
    await expect(page.getByText('Fallback record from base post endpoint')).toBeVisible();
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
