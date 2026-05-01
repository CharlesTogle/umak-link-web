import { Page, expect } from '@playwright/test';

/**
 * Helper to wait for and verify that a page has loaded with expected content
 */
export async function waitForPageLoad(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Helper to fill and submit a form
 */
export async function fillAndSubmitForm(
  page: Page,
  fields: Record<string, string>,
  submitButtonSelector: string = 'button[type="submit"]'
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
  await page.click(submitButtonSelector);
}

/**
 * Helper to check if a toast/notification is visible with text
 */
export async function expectToastMessage(
  page: Page,
  message: string,
  timeout: number = 5000
): Promise<void> {
  const toastLocator = page.locator(`text="${message}"`);
  await expect(toastLocator).toBeVisible({ timeout });
}

/**
 * Helper to click and wait for navigation
 */
export async function clickAndWaitForNavigation(
  page: Page,
  selector: string
): Promise<void> {
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.click(selector),
  ]);
}

/**
 * Helper to get pagination info (current page, total pages, etc)
 */
export async function getPaginationInfo(page: Page): Promise<{
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}> {
  // Adjust selectors based on your actual pagination UI
  const paginationText = await page.locator('[data-testid="pagination-info"]').textContent();

  // Example: "Page 1 of 5"
  const match = paginationText?.match(/Page (\d+) of (\d+)/) || null;

  return {
    currentPage: match ? parseInt(match[1]!, 10) : 1,
    totalPages: match ? parseInt(match[2]!, 10) : 1,
    hasNextPage: match ? parseInt(match[1]!, 10) < parseInt(match[2]!, 10) : false,
    hasPreviousPage: match ? parseInt(match[1]!, 10) > 1 : false,
  };
}

/**
 * Helper to wait for and extract table rows
 */
export async function getTableRows(
  page: Page,
  tableSelector: string = 'table'
): Promise<number> {
  const rowCount = await page.locator(`${tableSelector} tbody tr`).count();
  return rowCount;
}

/**
 * Helper to filter/search in a table
 */
export async function filterTable(
  page: Page,
  searchSelector: string,
  searchTerm: string
): Promise<void> {
  await page.fill(searchSelector, searchTerm);
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to verify modal/dialog is visible
 */
export async function expectModalVisible(
  page: Page,
  modalTitle: string,
  timeout: number = 5000
): Promise<void> {
  const modalLocator = page.locator(`[role="dialog"] :has-text("${modalTitle}")`);
  await expect(modalLocator).toBeVisible({ timeout });
}

/**
 * Helper to close modal by clicking close button
 */
export async function closeModal(
  page: Page,
  closeSelector: string = '[aria-label="Close"]'
): Promise<void> {
  await page.click(closeSelector);
  // Wait for modal animation
  await page.waitForTimeout(300);
}

/**
 * Helper to verify element is NOT visible
 */
export async function expectElementNotVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector)).not.toBeVisible({ timeout });
}

/**
 * Helper to verify URL contains path
 */
export async function expectUrlToContain(
  page: Page,
  path: string
): Promise<void> {
  expect(page.url()).toContain(path);
}

/**
 * Helper to get current user info from page
 */
export async function getCurrentUserFromPage(page: Page): Promise<{
  userName: string | null;
  userRole: string | null;
}> {
  const userName = await page.locator('[data-testid="user-name"]').textContent();
  const userRole = await page.locator('[data-testid="user-role"]').textContent();

  return {
    userName: userName?.trim() || null,
    userRole: userRole?.trim() || null,
  };
}

/**
 * Helper to scroll to bottom of page (for infinite scroll)
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
  // Wait for lazy-loaded content
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to wait for multiple network requests to complete
 */
export async function waitForAllNetworkRequests(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}
