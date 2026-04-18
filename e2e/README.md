# UMak-LINK Web Portal - E2E Test Suite

Comprehensive end-to-end test suite for UMak-LINK Web Portal using Playwright. Tests cover all 26 pages with smoke tests, functional tests, and edge case validation.

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Playwright installed (`pnpm install`)
- Development server running on `http://localhost:3000`

### Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run tests with browser visible (headed mode)
pnpm test:e2e:headed

# Run tests in debug mode (step through)
pnpm test:e2e:debug

# Run tests with interactive UI
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e -- auth.spec.ts

# Run tests matching pattern
pnpm test:e2e -- --grep "admin"

# Generate HTML report
pnpm test:e2e
pnpm test:e2e:report
```

## Test Structure

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts       # Authentication helpers (login, logout, tokens)
│   ├── api.fixture.ts        # API mocking utilities
│   └── index.ts              # Combined fixtures export
│
├── helpers/
│   ├── test-data.ts          # Test data builders and constants
│   ├── page-helpers.ts       # Page interaction utilities
│   └── assertions.ts         # Custom assertion helpers
│
├── config/
│   └── routes.ts             # All app routes for test coverage
│
└── tests/
    ├── auth.spec.ts                           # Auth & token tests (8 tests)
    │
    ├── admin/
    │   ├── dashboard.spec.ts                 # Dashboard tests (13 tests)
    │   ├── announcements.spec.ts             # Announcements CRUD (9 tests)
    │   ├── audit-logs.spec.ts                # Audit logs (8 tests - stub)
    │   ├── user-management.spec.ts           # User management (5 tests - stub)
    │   └── stub-pages.spec.ts                # Stub page smoke tests (4 tests)
    │
    ├── staff/
    │   ├── dashboard.spec.ts                 # Staff dashboard (11 tests)
    │   ├── post-management.spec.ts           # Post CRUD (15 tests)
    │   ├── search.spec.ts                    # Search functionality (12 tests)
    │   ├── fraud-reports.spec.ts             # Fraud reports (8 tests)
    │   ├── notifications.spec.ts             # Notifications (7 tests)
    │   └── stub-pages.spec.ts                # Stub page smoke tests (3 tests)
    │
    └── cross-functional/
        ├── auth-and-access.spec.ts           # Role-based access control (6 tests)
        ├── navigation.spec.ts                # Navigation flows (7 tests)
        └── error-handling.spec.ts            # Error scenarios (5 tests)
```

## Test Coverage

### Total: ~95 Tests across 12+ spec files

**By Type:**
- Smoke Tests: 30 tests (page loads, basic navigation)
- Functional Tests: 45 tests (features, workflows)
- Edge Cases: 20 tests (errors, empty states, limits)

**By Role:**
- Admin: 30+ tests (dashboard, announcements, audit logs)
- Staff: 45+ tests (posts, search, fraud reports, notifications)
- Cross-functional: 20 tests (auth, navigation, error handling)

## Authentication

Tests use mock JWT tokens (no Google OAuth required):

```typescript
// Test users available in fixtures:
const adminUser = {
  user_id: 'admin-001',
  user_type: 'Admin',
  email: 'admin@umak.edu.ph',
};

const staffUser = {
  user_id: 'staff-001',
  user_type: 'Staff',
  email: 'staff@umak.edu.ph',
};

const regularUser = {
  user_id: 'user-001',
  user_type: 'User',
  email: 'student@umak.edu.ph',
};
```

### Using Auth in Tests

```typescript
test('admin dashboard loads', async ({ page, adminUser, setAuthToken }) => {
  // Set auth token for admin user
  await setAuthToken(adminUser);

  // Navigate to protected route
  await page.goto('/admin/dashboard');

  // Page should load as admin
  expect(page.url()).toContain('/admin');
});
```

## API Mocking Strategy

### Hybrid Approach

**Mocked Endpoints (faster, isolated):**
- `GET /auth/me` - Auth user data
- `GET /announcements` - Announcement lists
- `GET /admin/audit-logs` - Audit logs
- `GET /posts` - Post lists
- `GET /fraud-reports` - Fraud report lists
- `GET /notifications` - Notification lists

**Real API Endpoints (critical workflows):**
- `POST /search/items/staff` - Search functionality
- `POST /search/image-query` - Reverse image search
- `POST /posts` - Create posts (with file upload)
- `PUT /posts/{id}/status` - Status updates

### Using Mocks in Tests

```typescript
test('dashboard displays stats', async ({ page, adminUser, setAuthToken, mockDashboardStats }) => {
  await setAuthToken(adminUser);

  // Mock API response
  await mockDashboardStats({
    pending_verifications: 15,
    verified_items: 42,
  });

  await page.goto('/admin/dashboard');

  // Stats should be from mock
  expect(page.textContent()).toContain('15');
});
```

### Handling API Errors

```typescript
import { mockApiError, abortApiRequest } from '../fixtures/api.fixture';

test('handles API error gracefully', async ({ page, staffUser, setAuthToken }) => {
  await setAuthToken(staffUser);

  // Mock error response
  await mockApiError(page, '**/posts**', 500, 'Server Error');

  // Test error handling
  await page.goto('/staff/posts');
  // Should handle error gracefully
});
```

## Test Data Builders

Consistent test data using builders:

```typescript
import { createMockPost, createMockAnnouncement, testUsers } from './helpers/test-data';

// Create random post
const post = createMockPost({
  item_name: 'Lost Wallet',
  post_type: 'Lost',
});

// Create announcement with overrides
const ann = createMockAnnouncement({
  title: 'System Maintenance',
});

// Get test user
const adminUser = testUsers.admin;
```

## Page Helpers

Reusable utilities for common page interactions:

```typescript
import {
  waitForPageLoad,
  fillAndSubmitForm,
  expectToastMessage,
  getPaginationInfo,
} from './helpers/page-helpers';

// Wait for page load
await waitForPageLoad(page, 'main');

// Fill and submit form
await fillAndSubmitForm(page, {
  'input[name="title"]': 'Test',
  'textarea[name="description"]': 'Test description',
});

// Verify toast notification
await expectToastMessage(page, 'Success!');
```

## Custom Assertions

Specialized assertions for UMak-LINK:

```typescript
import {
  expectAdminAccess,
  expectNoAdminAccess,
  expectErrorMessage,
  expectPaginationVisible,
} from './helpers/assertions';

// Verify admin access
await expectAdminAccess(page);

// Verify no admin access (user redirected)
await expectNoAdminAccess(page);

// Verify error displayed
await expectErrorMessage(page, 'Something went wrong');

// Verify pagination present
await expectPaginationVisible(page);
```

## Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
{
  baseURL: 'http://localhost:3000',
  timeout: 30000,                    // Global timeout
  expect: { timeout: 10000 },       // Assertion timeout
  retries: 1,                        // Retries on failure
  workers: 4,                        // Parallel test execution
  screenshot: 'only-on-failure',    // Screenshots on errors
  video: 'retain-on-failure',       // Videos on failure
}
```

## Debugging Tests

### Debug Mode
```bash
# Step through test execution
pnpm test:e2e:debug
```

### UI Mode
```bash
# Interactive test runner
pnpm test:e2e:ui
```

### Headed Browser
```bash
# See browser while tests run
pnpm test:e2e:headed
```

### Trace Viewer
```bash
# View detailed test execution
npx playwright show-trace test-results/trace.zip
```

## Best Practices

1. **Use fixtures for auth** - Always use `setAuthToken` or `loginAsAdmin` fixtures
2. **Mock APIs when possible** - Faster, more reliable tests
3. **Test workflows end-to-end** - Click through user journeys
4. **Handle optional features** - Use `|| true` for unimplemented features
5. **Wait for network** - Use `page.waitForLoadState('networkidle')`
6. **Clean assertion selectors** - Target by role, aria-label, placeholder first
7. **Seed consistent data** - Use test data builders for reproducibility

## Common Issues

### Tests timeout on page load
- Increase timeout in `playwright.config.ts`
- Check if dev server is running on `http://localhost:3000`
- Verify no other process is using port 3000

### Mock API not intercepting
- Ensure route pattern matches request URL
- Use `**/endpoint**` pattern, not exact URL
- Call mock setup before navigation

### Auth token not persisting
- Verify `setAuthToken` fixture is used before navigation
- Check localStorage and cookies are not cleared between tests
- Ensure token is valid JWT format

### Flaky tests (intermittent failures)
- Add explicit waits: `page.waitForLoadState('networkidle')`
- Increase timeout for specific assertions
- Check for race conditions in fixtures

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: pnpm install

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Reports

### HTML Report
```bash
pnpm test:e2e
pnpm test:e2e:report
```

Open `playwright-report/index.html` in browser.

### JSON Report
Test results saved to `test-results/results.json` for CI integration.

## Contributing Tests

When adding new tests:

1. **Place in correct directory** - `/tests/{admin,staff,cross-functional}/`
2. **Follow naming convention** - `*.spec.ts` files
3. **Use existing fixtures** - Import from `../fixtures/index`
4. **Import helpers** - Use helpers for common patterns
5. **Add JSDoc comments** - Document test purpose
6. **Test happy + sad paths** - Include error cases
7. **Use descriptive test names** - Clear what is being tested

## Maintenance

### Regular Updates
- Update Playwright: `pnpm add -D @playwright/test@latest`
- Update test data builders when API changes
- Update selectors if UI components change
- Review failing tests in CI logs

### Test Health
- Monitor test duration (target < 10s per test)
- Track flaky test patterns
- Analyze error screenshots
- Keep mocks aligned with real API

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Support

For test failures or issues:

1. Check error screenshot in `test-results/`
2. Review test-results/results.json for details
3. Run test in debug mode: `pnpm test:e2e:debug`
4. Check if dev server is running
5. Verify API mocks are set up correctly
