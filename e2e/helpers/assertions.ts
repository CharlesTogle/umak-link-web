import { Page, expect } from '@playwright/test';

/**
 * Verify user has access to admin routes (should be redirected if not admin)
 */
export async function expectAdminAccess(page: Page): Promise<void> {
  // Should not be redirected away
  expect(page.url()).toContain('/admin');
  // Should see admin-specific content
  await expect(page.locator('text=Dashboard')).toBeVisible();
}

/**
 * Verify user does NOT have access to admin routes
 */
export async function expectNoAdminAccess(page: Page): Promise<void> {
  // Should be redirected to not-allowed page
  await page.waitForURL('**/not-allowed', { timeout: 10000 });
  await expect(page.locator('text=Not Allowed')).toBeVisible();
}

/**
 * Verify user has access to staff routes
 */
export async function expectStaffAccess(page: Page): Promise<void> {
  // Should not be redirected away
  expect(page.url()).toContain('/staff');
  // Should see staff-specific content
  await expect(page.locator('[role="navigation"]')).toBeVisible();
}

/**
 * Verify user does NOT have access to staff routes
 */
export async function expectNoStaffAccess(page: Page): Promise<void> {
  // Should be redirected to not-allowed page or home
  const url = page.url();
  expect(
    url.includes('not-allowed') || url.includes('/')
  ).toBeTruthy();
}

/**
 * Verify page has required navigation elements
 */
export async function expectNavigationVisible(page: Page): Promise<void> {
  // Check for sidebar or header navigation
  const navigationSelector = '[role="navigation"], aside, nav, [data-testid="sidebar"]';
  await expect(page.locator(navigationSelector).first()).toBeVisible();
}

/**
 * Verify empty state is displayed
 */
export async function expectEmptyState(
  page: Page,
  emptyStateText: string = 'No items'
): Promise<void> {
  await expect(
    page.locator(`text="${emptyStateText}"`)
  ).toBeVisible();
}

/**
 * Verify loading state is shown
 */
export async function expectLoadingState(page: Page): Promise<void> {
  const loadingSelector = '[data-testid="loading"], .spinner, .loader';
  await expect(page.locator(loadingSelector).first()).toBeVisible();
}

/**
 * Verify error message is displayed
 */
export async function expectErrorMessage(
  page: Page,
  errorText: string = 'Error'
): Promise<void> {
  await expect(
    page.locator(`text="${errorText}"`)
  ).toBeVisible();
}

/**
 * Verify success toast is shown
 */
export async function expectSuccessToast(
  page: Page,
  successText: string = 'Success'
): Promise<void> {
  await expect(
    page.locator(`text="${successText}"`)
  ).toBeVisible({ timeout: 5000 });
}

/**
 * Verify table/list contains expected rows
 */
export async function expectTableContainsRows(
  page: Page,
  expectedCount: number,
  tableSelector: string = 'table'
): Promise<void> {
  const rowLocator = page.locator(`${tableSelector} tbody tr`);
  await expect(rowLocator).toHaveCount(expectedCount);
}

/**
 * Verify pagination controls are visible
 */
export async function expectPaginationVisible(page: Page): Promise<void> {
  const paginationSelector = '[data-testid="pagination"], .pagination, nav[aria-label="Pagination"]';
  await expect(page.locator(paginationSelector).first()).toBeVisible();
}

/**
 * Verify form field has validation error
 */
export async function expectFormFieldError(
  page: Page,
  fieldLabel: string,
  errorMessage: string
): Promise<void> {
  const fieldLocator = page.locator(`label:has-text("${fieldLabel}")`).locator('..');
  await expect(
    fieldLocator.locator(`text="${errorMessage}"`)
  ).toBeVisible();
}

/**
 * Verify image is loaded (src attribute is set and not placeholder)
 */
export async function expectImageLoaded(
  page: Page,
  imageSelector: string
): Promise<void> {
  const imageLocator = page.locator(imageSelector);
  const src = await imageLocator.getAttribute('src');
  expect(src).toBeTruthy();
  expect(src).not.toContain('placeholder');
  expect(src).not.toContain('data:image');
}

/**
 * Verify button is enabled/disabled
 */
export async function expectButtonEnabled(
  page: Page,
  buttonText: string,
  enabled: boolean = true
): Promise<void> {
  const buttonLocator = page.locator(`button:has-text("${buttonText}")`);
  if (enabled) {
    await expect(buttonLocator).not.toBeDisabled();
  } else {
    await expect(buttonLocator).toBeDisabled();
  }
}

/**
 * Verify badge/tag is visible with count
 */
export async function expectBadgeCount(
  page: Page,
  badgeSelector: string,
  expectedCount: number
): Promise<void> {
  const badgeLocator = page.locator(badgeSelector);
  const count = await badgeLocator.textContent();
  expect(count?.trim()).toBe(expectedCount.toString());
}

/**
 * Verify page title/heading
 */
export async function expectPageTitle(
  page: Page,
  title: string
): Promise<void> {
  await expect(
    page.locator(`h1:has-text("${title}"), h2:has-text("${title}")`)
  ).toBeVisible();
}

/**
 * Verify breadcrumbs path
 */
export async function expectBreadcrumbs(
  page: Page,
  expectedPaths: string[]
): Promise<void> {
  const breadcrumbLocator = page.locator('[data-testid="breadcrumbs"], nav[aria-label="Breadcrumb"]');
  for (const path of expectedPaths) {
    await expect(
      breadcrumbLocator.locator(`text="${path}"`)
    ).toBeVisible();
  }
}

/**
 * Verify user role is displayed correctly
 */
export async function expectUserRoleDisplayed(
  page: Page,
  expectedRole: 'Admin' | 'Staff' | 'User'
): Promise<void> {
  await expect(
    page.locator(`text="${expectedRole}"`)
  ).toBeVisible();
}

/**
 * Verify filter/search is applied
 */
export async function expectFilterApplied(
  page: Page,
  filterValue: string
): Promise<void> {
  const filterInput = page.locator('input[placeholder*="Search"], input[placeholder*="Filter"]');
  const value = await filterInput.inputValue();
  expect(value).toBe(filterValue);
}
