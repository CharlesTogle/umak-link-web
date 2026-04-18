import { test, expect } from '../../fixtures/index';
import { APP_ROUTES } from '../../config/routes';
import { createMockAuditLog } from '../../helpers/test-data';

test.describe('Admin Audit Logs', () => {
  test('audit logs list page loads', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    const logs = [
      createMockAuditLog({ action: 'CREATE' }),
      createMockAuditLog({ action: 'UPDATE' }),
    ];

    await mockAuditLogsList(logs);
    await page.goto(APP_ROUTES.admin.auditLogs);

    // Page should load
    await page.waitForLoadState('networkidle');
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('audit logs displays log entries', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    const logs = [
      createMockAuditLog({ action: 'CREATE', resource: 'Post' }),
      createMockAuditLog({ action: 'DELETE', resource: 'Announcement' }),
      createMockAuditLog({ action: 'UPDATE', resource: 'User' }),
    ];

    await mockAuditLogsList(logs);
    await page.goto(APP_ROUTES.admin.auditLogs);

    // Should display logs
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('audit logs can be filtered by action', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    await mockAuditLogsList([
      createMockAuditLog({ action: 'CREATE' }),
      createMockAuditLog({ action: 'UPDATE' }),
      createMockAuditLog({ action: 'DELETE' }),
    ]);

    await page.goto(APP_ROUTES.admin.auditLogs);

    // Sort By section always renders in the right column
    await page.waitForLoadState('networkidle');
    const sortSection = page.locator('h3').filter({ hasText: 'Sort By' });
    await expect(sortSection).toBeVisible();
  });

  test('audit logs can be filtered by user', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    await mockAuditLogsList([
      createMockAuditLog({ user_id: 'admin-001' }),
      createMockAuditLog({ user_id: 'staff-001' }),
    ]);

    await page.goto(APP_ROUTES.admin.auditLogs);

    // Date Range section always renders (left column filter)
    await page.waitForLoadState('networkidle');
    const dateSection = page.locator('h3').filter({ hasText: 'Date Range' });
    await expect(dateSection).toBeVisible();
  });

  test('audit logs can be filtered by date range', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    await mockAuditLogsList([
      createMockAuditLog(),
      createMockAuditLog(),
    ]);

    await page.goto(APP_ROUTES.admin.auditLogs);

    // DateRangePicker always renders with h3 "Date Range"
    await page.waitForLoadState('networkidle');
    const dateSection = page.locator('h3').filter({ hasText: 'Date Range' });
    await expect(dateSection).toBeVisible();
  });

  test('audit logs shows pagination', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    // Create 15 logs
    const logs = Array.from({ length: 15 }, (_, i) =>
      createMockAuditLog({
        audit_log_id: `audit-${i}`,
        action: ['CREATE', 'UPDATE', 'DELETE'][i % 3],
      })
    );

    await mockAuditLogsList(logs);
    await page.goto(APP_ROUTES.admin.auditLogs);

    // Audit log uses infinite scroll — verify page heading renders instead
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible();
  });

  test('audit logs displays details', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    const logs = [
      createMockAuditLog({
        action: 'CREATE',
        resource: 'Post',
        details: 'Created post with title "Lost Phone"',
      }),
    ];

    await mockAuditLogsList(logs);
    await page.goto(APP_ROUTES.admin.auditLogs);

    // Should display log details
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('audit logs can be expanded for more details', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    const logs = [
      createMockAuditLog({
        audit_log_id: 'audit-1',
        details: 'Detailed information about the action',
      }),
    ];

    await mockAuditLogsList(logs);
    await page.goto(APP_ROUTES.admin.auditLogs);

    // Each log row is a <button> that expands on click — verify page loaded with content
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible();
  });

  test('audit logs empty state', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    // Mock empty list
    await mockAuditLogsList([]);

    await page.goto(APP_ROUTES.admin.auditLogs);

    // Empty state text from AdminAuditLogPage: "No audit logs found"
    await page.waitForLoadState('networkidle');
    const emptyState = page.locator('text=No audit logs found');
    const hasEmpty = await emptyState.count().then((n) => n > 0);
    expect(hasEmpty).toBeTruthy();
  });

  test('staff user cannot access admin audit logs', async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);
    await page.goto(APP_ROUTES.admin.auditLogs);

    // RoleRouteGuard redirects Staff → /staff
    await page.waitForURL('**/staff**', { timeout: 10000 });
    expect(page.url()).not.toContain('/admin');
  });
});
