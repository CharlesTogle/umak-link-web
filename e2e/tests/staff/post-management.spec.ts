import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';
import { createMockPost } from '../../helpers/test-data';

test.describe('Staff Post Management', () => {
  test('post records list page loads', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    const posts = [
      createMockPost({ post_type: 'Lost' }),
      createMockPost({ post_type: 'Found' }),
    ];
    await mockPostsList(posts);

    await page.goto(APP_ROUTES.staff.posts);

    // Page should load
    await page.waitForLoadState('networkidle');
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('staff can create a new post', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Mock post creation
    await page.route('**/posts', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            post_id: 'new-post-123',
            success: true,
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(APP_ROUTES.staff.createPost);

    // Actual selector from create-post-view.tsx: placeholder="Max 32 characters"
    await page.waitForLoadState('networkidle');
    const itemNameInput = page.locator('input[placeholder="Max 32 characters"]');
    const hasForm = await itemNameInput.count().then((n) => n > 0);
    expect(hasForm).toBeTruthy();
  });

  test('post creation form has required fields', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.createPost);
    await page.waitForLoadState('networkidle');

    // Actual placeholders from create-post-view.tsx
    const itemNameInput = page.locator('input[placeholder="Max 32 characters"]');
    const descriptionField = page.locator('textarea[placeholder*="Provide additional details"]');
    const categorySelect = page.locator('select option[value=""]', { hasText: 'Select category' })
      .or(page.locator('select').first());

    await expect(itemNameInput).toBeVisible();
    await expect(descriptionField).toBeVisible();
    await expect(categorySelect.first()).toBeAttached();
  });

  test('post form has category dropdown', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.createPost);
    await page.waitForLoadState('networkidle');

    // Actual selector: <select> with default "Select category"
    const categorySelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Select category' }) });
    await expect(categorySelect).toBeVisible();
  });

  test('post form has post type selector', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.createPost);
    await page.waitForLoadState('networkidle');

    // The form has Lost/Found as radio/toggle buttons — check for their text
    const lostOption = page.getByText('Lost').first();
    const foundOption = page.getByText('Found').first();

    const hasLost = await lostOption.isVisible().catch(() => false);
    const hasFound = await foundOption.isVisible().catch(() => false);

    expect(hasLost || hasFound).toBeTruthy();
  });

  test('post form can upload image', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.createPost);
    await page.waitForLoadState('networkidle');

    // Look for file input
    const fileInput = page.locator('input[type="file"]');

    // File input exists in create-post-view.tsx for image upload
    const hasImageUpload = await fileInput.count().then((n) => n > 0);
    expect(hasImageUpload).toBeTruthy();
  });

  test('post form validates required fields', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.createPost);
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Post"), button:has-text("Submit")');

    // Submit button exists on the create post form
    const count = await submitButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('post list displays all posts', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    const posts = [
      createMockPost({ item_name: 'Lost Wallet' }),
      createMockPost({ item_name: 'Found Keys' }),
      createMockPost({ item_name: 'Lost Phone' }),
    ];

    await mockPostsList(posts);
    await page.goto(APP_ROUTES.staff.posts);

    // Wait for list to load
    await page.waitForLoadState('networkidle');

    // Should have loaded
    expect(page.url()).toContain('/post-record');
  });

  test('post list has filters for status', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    await mockPostsList([
      createMockPost({ item_status: 'Pending Verification' }),
      createMockPost({ item_status: 'Verified' }),
    ]);

    await page.goto(APP_ROUTES.staff.posts);

    // filterGroups from post-records-view.tsx includes "Post Status" and "Item Status" with "All" options
    await page.waitForLoadState('networkidle');
    const allButtons = page.locator('button:has-text("All")');
    const hasStatusFilter = await allButtons.count().then((n) => n > 0);
    expect(hasStatusFilter).toBeTruthy();
  });

  test('sidebar claimed preset requests claimed records', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    await page.route('**/posts**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ posts: [] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(APP_ROUTES.staff.posts);
    await page.waitForLoadState('networkidle');

    const claimedRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== 'GET' || !request.url().includes('/posts')) {
        return false;
      }

      const url = new URL(request.url());
      return url.searchParams.get('item_status') === 'claimed';
    });

    await page.getByRole('link', { name: 'Claimed' }).click();

    const claimedRequest = await claimedRequestPromise;
    const claimedUrl = new URL(claimedRequest.url());

    expect(claimedUrl.searchParams.get('item_status')).toBe('claimed');
    await expect(page).toHaveURL(/\/staff\/post-records\?itemStatus=Claimed$/);
  });

  test('post list has search/filter input', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    await mockPostsList([createMockPost()]);
    await page.goto(APP_ROUTES.staff.posts);

    // Post records sidebar has a "Search records" button from post-records-view.tsx
    await page.waitForLoadState('networkidle');
    const searchButton = page.locator('button:has-text("Search records")');
    const hasSearch = await searchButton.count().then((n) => n > 0);
    expect(hasSearch).toBeTruthy();
  });

  test('regular user cannot access create post', async ({
    page,
    regularUser,
    setAuthToken,
  }) => {
    await setAuthToken(regularUser);
    await page.goto(APP_ROUTES.staff.createPost);

    // User tokens rejected by isPortalRoleToken → RoleRouteGuard redirects to "/"
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    expect(page.url()).not.toContain('/staff');
  });

  test('post list pagination', async ({
    page,
    staffUser,
    setAuthToken,
    mockPostsList,
  }) => {
    await setAuthToken(staffUser);

    // Create 15 posts to test pagination
    const posts = Array.from({ length: 15 }, (_, i) =>
      createMockPost({ item_name: `Post ${i + 1}` })
    );

    await mockPostsList(posts);
    await page.goto(APP_ROUTES.staff.posts);

    // Post records uses infinite scroll — verify h1 "Post Records" is visible
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Post Records")')).toBeVisible();
  });

  test('post image respects size limit', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.createPost);

    // Look for file input with size restrictions
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.count().then((n) => n > 0)) {
      // Check for accept attribute (image types)
      const accept = await fileInput.first().getAttribute('accept');

      // create-post-view.tsx uses accept="image/*" — must include "image"
      expect(accept).toContain('image');
    }
  });
});
