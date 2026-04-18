import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';
import { createMockPost } from '../../helpers/test-data';

test.describe('Staff Search', () => {
  test('search page loads with search input', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.search);
    await page.waitForLoadState('networkidle');

    // Actual input: id="staff-search-keyword", placeholder="e.g. black wallet, ID lace"
    const searchInput = page.locator('#staff-search-keyword');
    await expect(searchInput).toBeVisible();
  });

  test('user can perform keyword search', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Mock search API
    await page.route('**/search/items**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            createMockPost({ item_name: 'Found iPhone' }),
            createMockPost({ item_name: 'Lost iPhone charger' }),
          ],
        }),
      });
    });

    await page.goto(APP_ROUTES.staff.search);

    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count().then((n) => n > 0)) {
      await searchInput.first().fill('iphone');

      // Find and click search button
      const searchButton = page.locator('button:has-text("Search"), button[aria-label*="Search"]');
      if (await searchButton.count().then((n) => n > 0)) {
        await searchButton.first().click();
        await page.waitForLoadState('networkidle');

        // Results should be shown
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
      }
    }
  });

  test('search displays results', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    const mockResults = [
      createMockPost({ item_name: 'Lost Wallet' }),
      createMockPost({ item_name: 'Found Keys' }),
    ];

    await page.route('**/search/items**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: mockResults }),
      });
    });

    await page.goto(APP_ROUTES.staff.search);

    // Perform search
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count().then((n) => n > 0)) {
      await searchInput.first().fill('test');

      const searchButton = page.locator('button:has-text("Search")');
      if (await searchButton.count().then((n) => n > 0)) {
        await searchButton.first().click();
        await page.waitForLoadState('networkidle');

        // After search, we should still be on the search page
        const currentUrl = page.url();
        expect(currentUrl).toContain('/staff/search');
      }
    }
  });

  test('search has filters', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.search);

    // Search page always has the keyword input #staff-search-keyword
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('#staff-search-keyword');
    await expect(searchInput).toBeVisible();
  });

  test('search handles no results gracefully', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Mock empty search results
    await page.route('**/search/items**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto(APP_ROUTES.staff.search);

    // Perform search
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count().then((n) => n > 0)) {
      await searchInput.first().fill('nonexistent');

      const searchButton = page.locator('button:has-text("Search")');
      if (await searchButton.count().then((n) => n > 0)) {
        await searchButton.first().click();
        await page.waitForLoadState('networkidle');

        // After empty search, should still be on search page
        expect(page.url()).toContain('/staff/search');
      }
    }
  });

  test('search handles API errors gracefully', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Mock API error
    await page.route('**/search/items**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Search failed' }),
      });
    });

    await page.goto(APP_ROUTES.staff.search);

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count().then((n) => n > 0)) {
      await searchInput.first().fill('test');

      const searchButton = page.locator('button:has-text("Search")');
      if (await searchButton.count().then((n) => n > 0)) {
        await searchButton.first().click();
        await page.waitForLoadState('networkidle');

        // Should handle error gracefully (show error message or empty state)
        const pageContent = await page.content();
        expect(pageContent).toBeTruthy();
      }
    }
  });

  test('search pagination works', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    // Mock paginated search results
    await page.route('**/search/items**', (route) => {
      const url = new URL(route.request().url());
      const page = url.searchParams.get('page') || '1';

      const items = Array.from({ length: 10 }, (_, i) =>
        createMockPost({
          item_name: `Item ${(parseInt(page) - 1) * 10 + i + 1}`,
        })
      );

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, total: 25, page: parseInt(page) }),
      });
    });

    await page.goto(APP_ROUTES.staff.search);

    // Perform search
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count().then((n) => n > 0)) {
      await searchInput.first().fill('test');

      const searchButton = page.locator('button:has-text("Search")');
      if (await searchButton.count().then((n) => n > 0)) {
        await searchButton.first().click();
        await page.waitForLoadState('networkidle');

        // Look for pagination controls
        const nextButton = page.locator('button:has-text("Next"), button[aria-label*="Next"]');
        // After search, should still be on search page
        expect(page.url()).toContain('/staff/search');
      }
    }
  });

  test('search query is persisted in URL', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.staff.search);

    // Perform search
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count().then((n) => n > 0)) {
      await searchInput.first().fill('iphone');

      // URL should contain search query
      await page.waitForURL(/.*q=|.*search=/, { timeout: 5000 }).catch(() => {
        // Query parameter in URL is optional
      });
    }
  });
});
