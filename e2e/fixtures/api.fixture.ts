import { test as base, Page } from '@playwright/test';
import type { AuthUser, AuthMeResponse } from '@/types/auth';

type APIFixtures = {
  mockAuthMe: (user: AuthUser) => Promise<void>;
  mockDashboardStats: (statsData: any) => Promise<void>;
  mockAnnouncementsList: (announcements: any[]) => Promise<void>;
  mockAuditLogsList: (logs: any[]) => Promise<void>;
  mockPostsList: (posts: any[]) => Promise<void>;
  mockFraudReportsList: (reports: any[]) => Promise<void>;
  mockNotificationsList: (notifications: any[]) => Promise<void>;
  allowRealApi: (paths: string[]) => Promise<void>;
};

export const test = base.extend<APIFixtures>({
  mockAuthMe: async ({ page }, use) => {
    const mock = async (user: AuthUser) => {
      await page.route('**/auth/me', (route) => {
        const response: AuthMeResponse = {
          user,
        };
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      });
    };
    await use(mock);
  },

  mockDashboardStats: async ({ page }, use) => {
    const mock = async (statsData: any) => {
      await page.route('**/dashboard/stats**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(statsData),
        });
      });
    };
    await use(mock);
  },

  mockAnnouncementsList: async ({ page }, use) => {
    const mock = async (announcements: any[]) => {
      await page.route('**/announcements**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ announcements }),
        });
      });
    };
    await use(mock);
  },

  mockAuditLogsList: async ({ page }, use) => {
    const mock = async (logs: any[]) => {
      await page.route('**/audit-logs**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ logs }),
        });
      });
    };
    await use(mock);
  },

  mockPostsList: async ({ page }, use) => {
    const mock = async (posts: any[]) => {
      await page.route('**/posts**', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ posts }),
          });
        } else {
          route.continue();
        }
      });
    };
    await use(mock);
  },

  mockFraudReportsList: async ({ page }, use) => {
    const mock = async (reports: any[]) => {
      await page.route('**/fraud-reports**', (route) => {
        // Skip document navigations — pattern also matches /staff/fraud-reports page URL
        if (route.request().resourceType() === 'document') {
          route.continue();
          return;
        }
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ reports }),
          });
        } else {
          route.continue();
        }
      });
    };
    await use(mock);
  },

  mockNotificationsList: async ({ page }, use) => {
    const mock = async (notifications: any[]) => {
      await page.route('**/notifications**', (route) => {
        // Skip document navigations — pattern also matches /staff/notifications page URL
        if (route.request().resourceType() === 'document') {
          route.continue();
          return;
        }
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ notifications }),
          });
        } else {
          route.continue();
        }
      });
    };
    await use(mock);
  },

  allowRealApi: async ({ page }, use) => {
    const allow = async (paths: string[]) => {
      // Routes matching these paths will not be mocked
      // This allows real API calls for critical endpoints
      for (const path of paths) {
        await page.unroute(`**${path}**`);
      }
    };
    await use(allow);
  },
});

/**
 * Helper to mock an API error response
 */
export async function mockApiError(
  page: Page,
  pattern: string,
  statusCode: number = 500,
  message: string = 'Internal Server Error'
): Promise<void> {
  await page.route(pattern, (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    });
  });
}

/**
 * Helper to abort an API request (simulate network failure)
 */
export async function abortApiRequest(
  page: Page,
  pattern: string,
  reason: 'failed' | 'aborted' | 'timedout' = 'failed'
): Promise<void> {
  await page.route(pattern, (route) => {
    route.abort(reason);
  });
}

/**
 * Helper to delay API response (simulate slow network)
 */
export async function delayApiResponse(
  page: Page,
  pattern: string,
  delayMs: number = 3000
): Promise<void> {
  await page.route(pattern, (route) => {
    setTimeout(() => {
      route.continue();
    }, delayMs);
  });
}
