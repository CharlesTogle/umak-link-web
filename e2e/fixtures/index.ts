/**
 * Combined test fixture that merges auth and API fixtures
 */
import { test as base, expect } from '@playwright/test';
import type { AuthUser, AuthMeResponse } from '@/types/auth';
import { testUsers } from '../helpers/test-data';

/**
 * Create a mock JWT token
 */
function createMockJWT(user: AuthUser): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    user_id: user.user_id,
    user_name: user.user_name,
    email: user.email,
    user_type: user.user_type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  })).toString('base64');
  const signature = 'mock_signature';

  return `${header}.${payload}.${signature}`;
}

/**
 * Combined fixtures for auth and API
 */
type CombinedFixtures = {
  adminUser: AuthUser;
  staffUser: AuthUser;
  regularUser: AuthUser;
  loginAsAdmin: () => Promise<void>;
  loginAsStaff: () => Promise<void>;
  loginAsUser: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthToken: (user: AuthUser) => Promise<void>;
  mockAuthMe: (user: AuthUser) => Promise<void>;
  mockDashboardStats: (statsData: any) => Promise<void>;
  mockAnnouncementsList: (announcements: any[]) => Promise<void>;
  mockAuditLogsList: (logs: any[]) => Promise<void>;
  mockPostsList: (posts: any[]) => Promise<void>;
  mockFraudReportsList: (reports: any[]) => Promise<void>;
  mockNotificationsList: (notifications: any[]) => Promise<void>;
  allowRealApi: (paths: string[]) => Promise<void>;
};

export const test = base.extend<CombinedFixtures>({
  adminUser: testUsers.admin,
  staffUser: testUsers.staff,
  regularUser: testUsers.user,

  loginAsAdmin: async ({ page, adminUser }, use) => {
    const login = async () => {
      const token = createMockJWT(adminUser);
      await page.route('**/auth/me', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: adminUser }) });
      });
      await page.context().addCookies([
        { name: 'umak_link_web_api_token', value: token, url: 'http://localhost:3000', sameSite: 'Lax' },
      ]);
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
      await page.evaluate(
        ({ k, v, rk, rv }) => { localStorage.setItem(k, v); localStorage.setItem(rk, rv); },
        { k: 'umak_link_web_api_token', v: token, rk: 'umak_link_web_role', rv: adminUser.user_type }
      );
    };
    await use(login);
  },

  loginAsStaff: async ({ page, staffUser }, use) => {
    const login = async () => {
      const token = createMockJWT(staffUser);
      await page.route('**/auth/me', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: staffUser }) });
      });
      await page.context().addCookies([
        { name: 'umak_link_web_api_token', value: token, url: 'http://localhost:3000', sameSite: 'Lax' },
      ]);
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
      await page.evaluate(
        ({ k, v, rk, rv }) => { localStorage.setItem(k, v); localStorage.setItem(rk, rv); },
        { k: 'umak_link_web_api_token', v: token, rk: 'umak_link_web_role', rv: staffUser.user_type }
      );
    };
    await use(login);
  },

  loginAsUser: async ({ page, regularUser }, use) => {
    const login = async () => {
      const token = createMockJWT(regularUser);
      await page.context().addCookies([
        { name: 'umak_link_web_api_token', value: token, url: 'http://localhost:3000', sameSite: 'Lax' },
      ]);
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
      await page.evaluate(
        ({ k, v, rk, rv }) => { localStorage.setItem(k, v); localStorage.setItem(rk, rv); },
        { k: 'umak_link_web_api_token', v: token, rk: 'umak_link_web_role', rv: regularUser.user_type }
      );
    };
    await use(login);
  },

  logout: async ({ page }, use) => {
    const logout = async () => {
      // Clear cookies first (context level)
      await page.context().clearCookies();
      // Navigate home, then clear localStorage — order matters:
      // navigate first so we're on the right origin, then clear
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    };
    await use(logout);
  },

  setAuthToken: async ({ page }, use) => {
    const setToken = async (user: AuthUser) => {
      const token = createMockJWT(user);

      // Mock /auth/me — RoleRouteGuard calls hydrateUser() → fetchCurrentUser() → GET /auth/me
      await page.route('**/auth/me', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user }),
        });
      });

      // Set cookie (works before navigation at context level)
      await page.context().addCookies([
        {
          name: 'umak_link_web_api_token',
          value: token,
          url: 'http://localhost:3000',
          sameSite: 'Lax',
        },
      ]);

      // Navigate to establish origin, THEN set localStorage via evaluate.
      // addInitScript was wrong: it re-runs on every subsequent navigation,
      // so logout + goto('/') would re-inject the token.
      // waitUntil: 'commit' returns as soon as navigation starts, minimising side effects.
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
      await page.evaluate(
        ({ tokenKey, tokenValue, roleKey, roleValue }) => {
          localStorage.setItem(tokenKey, tokenValue);
          localStorage.setItem(roleKey, roleValue);
        },
        {
          tokenKey: 'umak_link_web_api_token',
          tokenValue: token,
          roleKey: 'umak_link_web_role',
          roleValue: user.user_type,
        }
      );
    };
    await use(setToken);
  },

  mockAuthMe: async ({ page }, use) => {
    const mock = async (user: AuthUser) => {
      await page.route('**/auth/me', (route) => {
        const response: AuthMeResponse = { user };
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
      for (const path of paths) {
        await page.unroute(`**${path}**`);
      }
    };
    await use(allow);
  },
});

export { expect };
