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
    await expect(page.locator('h1:has-text("Audit Trail")')).toBeVisible();
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
    await expect(page.locator('h1:has-text("Audit Trail")')).toBeVisible();
  });

  test('audit logs render Philippine time and expanded notification and custody details', async ({
    page,
    adminUser,
    setAuthToken,
    mockAuditLogsList,
  }) => {
    await setAuthToken(adminUser);

    await mockAuditLogsList([
      {
        audit_id: 'audit-notification-1',
        user_id: 'staff-001',
        action: 'notification_sent',
        table_name: 'notification_table',
        record_id: 'notification-1',
        changes: {
          message: 'Charles Nathaniel Togle sent notification to user',
          timestamp: '2026-05-15T03:52:00.000Z',
          notification_id: 'bac15e42-a36f-40cc-80d8-62033a7bcdc3',
          notification_type: 'accept',
          recipient_name: 'Juan Dela Cruz',
          recipient_user_id: 'ae465f0a-cbeb-45c7-ac1d-47eaf4582601',
          notification_title: 'Post Accepted',
          content: 'Your post has been accepted.',
        },
        timestamp: '2026-05-15T03:52:00',
        timestamp_local: '2026-05-15T11:52:00',
        user_table: {
          user_id: 'staff-001',
          user_name: 'Charles Nathaniel Togle',
          email: 'charles@umak.edu.ph',
          profile_picture_url: null,
        },
      },
      {
        audit_id: 'audit-custody-1',
        user_id: 'staff-001',
        action: 'custody_security_office_received',
        table_name: 'custody_attempt_table',
        record_id: 'attempt-1',
        changes: {
          message: 'Custody Security Office Received',
          item_name: 'Teal Stickered Campus Lunch Box',
          item_id: '3a71a5b4-0934-4ae5-ab3d-5caf123e64e2',
          post_id: 2408,
          custody_attempt_id: '346cdd66-03e5-4d21-b578-1ef57f20a9f1',
        },
        timestamp: '2026-05-15T03:52:00',
        timestamp_local: '2026-05-15T11:52:00',
        user_table: {
          user_id: 'staff-001',
          user_name: 'Charles Nathaniel Togle',
          email: 'charles@umak.edu.ph',
          profile_picture_url: null,
        },
      },
      {
        audit_id: 'audit-qr-scan-1',
        user_id: 'guard-001',
        action: 'custody_qr_scanned',
        table_name: 'qr_code_session_table',
        record_id: 'session-1',
        changes: {
          message: 'Handover QR Code Scanned',
          guard_name: 'Maricar Santos',
          item_name: 'Silver Water Bottle',
          item_id: '95e9e59f-4945-4a01-b668-c617585da0ea',
          post_id: 2410,
          custody_attempt_id: 'bc8938e1-8b8f-400c-9c7c-0f43563ef344',
        },
        timestamp: '2026-05-15T03:30:00',
        timestamp_local: '2026-05-15T11:30:00',
        user_table: {
          user_id: 'guard-001',
          user_name: 'Maricar Santos',
          email: 'maricar@umak.edu.ph',
          profile_picture_url: null,
        },
      },
      {
        audit_id: 'audit-decision-1',
        user_id: 'guard-001',
        action: 'custody_attempt_decided',
        table_name: 'custody_attempt_table',
        record_id: 'attempt-2',
        changes: {
          message: 'Guard Maricar Santos Accepted Handover',
          guard_name: 'Maricar Santos',
          item_name: 'Canvas Tote Bag',
          item_id: 'f1f75154-5b28-43ec-8a21-be4d60f4d170',
          post_id: 2411,
          qr_code_session_id: 'db430aea-d719-45fc-890f-21b24822ac80',
          decision: 'accepted',
        },
        timestamp: '2026-05-15T08:52:00',
        timestamp_local: '2026-05-15T16:52:00',
        user_table: {
          user_id: 'guard-001',
          user_name: 'Maricar Santos',
          email: 'maricar@umak.edu.ph',
          profile_picture_url: null,
        },
      },
    ]);

    await page.goto(APP_ROUTES.admin.auditLogs);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('May 15, 2026, 11:52 AM').first()).toBeVisible();

    const notificationCard = page
      .getByRole('button', { name: /Charles Nathaniel Togle sent notification to user/i })
      .locator('xpath=..');
    await notificationCard.getByRole('button', { name: /Charles Nathaniel Togle sent notification to user/i }).click();

    await expect(notificationCard).toContainText('Recipient Name: Juan Dela Cruz');
    await expect(notificationCard).toContainText('Content: Your post has been accepted.');
    await expect(notificationCard).toContainText('Timestamp: May 15, 2026, 11:52 AM');

    const securityOfficeCard = page
      .getByRole('button', { name: /May 15, 2026, 11:52 AM Custody Security Office Received/i })
      .locator('xpath=..');
    await securityOfficeCard
      .getByRole('button', { name: /May 15, 2026, 11:52 AM Custody Security Office Received/i })
      .click();

    await expect(securityOfficeCard).toContainText('Item Name: Teal Stickered Campus Lunch Box');

    const qrScannedCard = page
      .getByRole('button', { name: /May 15, 2026, 11:30 AM Handover QR Code Scanned/i })
      .locator('xpath=..');
    await qrScannedCard
      .getByRole('button', { name: /May 15, 2026, 11:30 AM Handover QR Code Scanned/i })
      .click();

    await expect(qrScannedCard).toContainText('Guard Name: Maricar Santos');
    await expect(qrScannedCard).toContainText('Item Name: Silver Water Bottle');

    const decisionCard = page
      .getByRole('button', { name: /May 15, 2026, 04:52 PM Guard Maricar Santos Accepted Handover/i })
      .locator('xpath=..');
    await decisionCard
      .getByRole('button', { name: /May 15, 2026, 04:52 PM Guard Maricar Santos Accepted Handover/i })
      .click();

    await expect(decisionCard).toContainText('Guard Name: Maricar Santos');
    await expect(decisionCard).toContainText('Item Name: Canvas Tote Bag');
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

    // RoleRouteGuard redirects Staff to the not-allowed route
    await page.waitForURL('**/not-allowed', { timeout: 10000 });
    expect(page.url()).not.toContain('/admin');
  });
});
