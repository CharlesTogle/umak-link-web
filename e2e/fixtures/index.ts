/**
 * Combined test fixture that merges auth and API fixtures
 */
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { AuthUser, AuthMeResponse } from '@/types/auth';
import { testUsers } from '../helpers/test-data';

const FALLBACK_SUPABASE_PROJECT_REF = 'yqgpyvfpgvgecjlpzzgd';

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

function getSupabaseStorageKey(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return `sb-${FALLBACK_SUPABASE_PROJECT_REF}-auth-token`;
  }

  try {
    const hostname = new URL(supabaseUrl).hostname;
    const projectRef = hostname.split('.')[0];
    return projectRef
      ? `sb-${projectRef}-auth-token`
      : `sb-${FALLBACK_SUPABASE_PROJECT_REF}-auth-token`;
  } catch {
    return `sb-${FALLBACK_SUPABASE_PROJECT_REF}-auth-token`;
  }
}

function createMockSupabaseSession(user: AuthUser, token: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 7;

  return {
    access_token: token,
    refresh_token: 'mock_refresh_token',
    expires_at: expiresAt,
    expires_in: 86400 * 7,
    token_type: 'bearer',
    user: {
      id: user.user_id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      phone: '',
      app_metadata: {
        provider: 'google',
        providers: ['google'],
      },
      user_metadata: {
        full_name: user.user_name,
        avatar_url: user.profile_picture_url,
        user_type: user.user_type,
      },
      identities: [],
      created_at: '2026-05-16T08:00:00.000Z',
      updated_at: '2026-05-16T08:00:00.000Z',
    },
  };
}

async function seedPortalSession(
  page: Page,
  user: AuthUser,
  token: string
): Promise<void> {
  const supabaseStorageKey = getSupabaseStorageKey();
  const supabaseSession = createMockSupabaseSession(user, token);

  await page.addInitScript(
    ({ tokenKey, tokenValue, roleKey, roleValue, storageKey, storageValue }) => {
      if (window.sessionStorage.getItem('__portal_auth_seeded__') === '1') {
        return;
      }

      localStorage.setItem(tokenKey, tokenValue);
      localStorage.setItem(roleKey, roleValue);

      if (storageKey && storageValue) {
        localStorage.setItem(storageKey, storageValue);
      }

      window.sessionStorage.setItem('__portal_auth_seeded__', '1');
    },
    {
      tokenKey: 'umak_link_web_api_token',
      tokenValue: token,
      roleKey: 'umak_link_web_role',
      roleValue: user.user_type,
      storageKey: supabaseStorageKey,
      storageValue: supabaseStorageKey ? JSON.stringify(supabaseSession) : null,
    }
  );
}

/**
 * Combined fixtures for auth and API
 */
type CombinedFixtures = {
  adminUser: AuthUser;
  staffUser: AuthUser;
  guardUser: AuthUser;
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
  guardUser: testUsers.guard,
  regularUser: testUsers.user,

  loginAsAdmin: async ({ page, adminUser }, use) => {
    const login = async () => {
      const token = createMockJWT(adminUser);
      await page.route('**/auth/me', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: adminUser }) });
      });
      await seedPortalSession(page, adminUser, token);
      await page.context().addCookies([
        { name: 'umak_link_web_api_token', value: token, url: 'http://localhost:3000', sameSite: 'Lax' },
      ]);
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
    };
    await use(login);
  },

  loginAsStaff: async ({ page, staffUser }, use) => {
    const login = async () => {
      const token = createMockJWT(staffUser);
      await page.route('**/auth/me', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: staffUser }) });
      });
      await seedPortalSession(page, staffUser, token);
      await page.context().addCookies([
        { name: 'umak_link_web_api_token', value: token, url: 'http://localhost:3000', sameSite: 'Lax' },
      ]);
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
    };
    await use(login);
  },

  loginAsUser: async ({ page, regularUser }, use) => {
    const login = async () => {
      const token = createMockJWT(regularUser);
      await seedPortalSession(page, regularUser, token);
      await page.context().addCookies([
        { name: 'umak_link_web_api_token', value: token, url: 'http://localhost:3000', sameSite: 'Lax' },
      ]);
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
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
      await seedPortalSession(page, user, token);

      // Navigate to establish origin, THEN set localStorage via evaluate.
      // addInitScript was wrong: it re-runs on every subsequent navigation,
      // so logout + goto('/') would re-inject the token.
      // waitUntil: 'commit' returns as soon as navigation starts, minimising side effects.
      await page.goto('http://localhost:3000', { waitUntil: 'commit' });
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
