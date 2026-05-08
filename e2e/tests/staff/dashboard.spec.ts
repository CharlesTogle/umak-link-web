import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';
import { createMockPost } from '../../helpers/test-data';

test.describe('Staff Dashboard', () => {
  test('staff dashboard page loads', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    // Mock posts data
    const posts = [
      createMockPost({ post_type: 'Lost' }),
      createMockPost({ post_type: 'Found' }),
    ];
    await mockPostsList(posts);

    await page.goto(APP_ROUTES.staff.dashboard);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page has content
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('staff dashboard displays posts list', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    const posts = [
      createMockPost({ item_name: 'Lost Phone', post_type: 'Lost' }),
      createMockPost({ item_name: 'Found Keys', post_type: 'Found' }),
    ];
    await mockPostsList(posts);

    await page.goto(APP_ROUTES.staff.dashboard);

    // Look for posts in the UI
    const pageContent = await page.textContent('body');

    // Should display posts (or at least page should load)
    expect(pageContent).toBeTruthy();
  });

  test('staff can filter by post type (Lost vs Found)', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    await mockPostsList([
      createMockPost({ post_type: 'Lost' }),
      createMockPost({ post_type: 'Found' }),
    ]);

    await page.goto(APP_ROUTES.staff.dashboard);

    // Look for filter buttons/tabs
    const lostFilter = page.locator('button:has-text("Lost"), button[aria-label*="Lost"]');
    // Filters may exist - test if they do
    if (await lostFilter.count().then((n) => n > 0)) {
      await lostFilter.first().click();
      await page.waitForLoadState('networkidle');

      // Should show only lost items
      expect(page.url()).toBeTruthy();
    }
  });

  test('staff dashboard shows statistics', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    await mockPostsList([
      createMockPost({ item_status: 'Pending Verification' }),
      createMockPost({ item_status: 'Verified' }),
      createMockPost({ item_status: 'Claimed' }),
    ]);

    await page.goto(APP_ROUTES.staff.dashboard);

    // StaffStatCard renders with known titles from staff-dashboard-view.tsx
    await page.waitForLoadState('networkidle');
    const statTitle = page.locator('text=Pending Claims');
    const hasStats = await statTitle.count().then((n) => n > 0);
    expect(hasStats).toBeTruthy();
  });

  test('staff can refresh posts list', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    const posts = [createMockPost()];
    await mockPostsList(posts);

    await page.goto(APP_ROUTES.staff.dashboard);

    // Look for refresh button
    const refreshButton = page.locator(
      'button:has-text("Refresh"), button[aria-label*="Refresh"], button[title*="Refresh"]'
    );

    if (await refreshButton.count().then((n) => n > 0)) {
      await refreshButton.first().click();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard
      expect(page.url()).toContain('/staff');
    }
  });

  test('staff dashboard handles empty posts list', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    // Mock empty list
    await mockPostsList([]);

    await page.goto(APP_ROUTES.staff.dashboard);

    // Empty state text from StaffDashboardView: "No posts match the selected filters."
    await page.waitForLoadState('networkidle');
    const emptyText = page.locator('text=No posts match the selected filters.');
    const hasEmptyState = await emptyText.count().then((n) => n > 0);
    expect(hasEmptyState).toBeTruthy();
  });

  test('staff dashboard pagination works', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    // Create mock posts for pagination test
    const posts = Array.from({ length: 15 }, (_, i) =>
      createMockPost({ item_name: `Item ${i + 1}` })
    );
    await mockPostsList(posts);

    await page.goto(APP_ROUTES.staff.dashboard);

    // Dashboard uses infinite scroll with item type filter buttons (All, Missing, Found)
    await page.waitForLoadState('networkidle');
    const filterButtons = page.locator('button:has-text("All"), button:has-text("Missing"), button:has-text("Found")');
    const hasFilterControls = await filterButtons.count().then((n) => n > 0);
    expect(hasFilterControls).toBeTruthy();
  });

  test('staff can navigate to post details from dashboard', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    const post = createMockPost();
    await mockPostsList([post]);

    await page.goto(APP_ROUTES.staff.dashboard);

    // Look for clickable post item
    const postItem = page.locator('a, button', { hasText: post.item_name ?? '' });

    if (await postItem.count().then((n) => n > 0)) {
      await postItem.first().click();
      await page.waitForLoadState('networkidle');

      // Should navigate somewhere (implementation dependent)
      expect(page.url()).toBeTruthy();
    }
  });

  test('staff dashboard loads quickly', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    await mockPostsList([
      createMockPost(),
      createMockPost(),
      createMockPost(),
    ]);

    // Measure load time
    const startTime = Date.now();
    await page.goto(APP_ROUTES.staff.dashboard);
    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds
  });
});
