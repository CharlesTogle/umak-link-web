import { test as base, Page } from '@playwright/test';
import type { AuthUser, AuthMeResponse } from '@/types/auth';
import { testUsers } from '../helpers/test-data';

/**
 * Create a mock JWT token with the given user type
 * Note: This is a mock token for testing purposes only
 * The token format matches what the app expects: base64-encoded JSON payload with user_type
 */
function createMockJWT(user: AuthUser): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    user_id: user.user_id,
    user_name: user.user_name,
    email: user.email,
    user_type: user.user_type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // Valid for 7 days
  })).toString('base64');
  const signature = 'mock_signature';

  return `${header}.${payload}.${signature}`;
}

/**
 * Auth fixture that provides login utilities for tests
 */
type AuthFixtures = {
  adminUser: AuthUser;
  staffUser: AuthUser;
  regularUser: AuthUser;
  loginAsAdmin: () => Promise<void>;
  loginAsStaff: () => Promise<void>;
  loginAsUser: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthToken: (user: AuthUser) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  adminUser: testUsers.admin,
  staffUser: testUsers.staff,
  regularUser: testUsers.user,

  loginAsAdmin: async ({ page, adminUser }, use) => {
    const login = async () => {
      await setAuthToken(page, adminUser);
      // Wait for auth to hydrate
      await page.waitForLoadState('networkidle');
    };
    await use(login);
  },

  loginAsStaff: async ({ page, staffUser }, use) => {
    const login = async () => {
      await setAuthToken(page, staffUser);
      // Wait for auth to hydrate
      await page.waitForLoadState('networkidle');
    };
    await use(login);
  },

  loginAsUser: async ({ page, regularUser }, use) => {
    const login = async () => {
      await setAuthToken(page, regularUser);
      // Wait for auth to hydrate
      await page.waitForLoadState('networkidle');
    };
    await use(login);
  },

  logout: async ({ page }, use) => {
    const logout = async () => {
      // Clear localStorage and cookies
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      // Clear all cookies
      const cookies = await page.context().cookies();
      for (const cookie of cookies) {
        await page.context().clearCookies({ name: cookie.name });
      }
      // Navigate to home to reset auth state
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    };
    await use(logout);
  },

  setAuthToken: async ({ page }, use) => {
    const setToken = async (user: AuthUser) => {
      const token = createMockJWT(user);

      // Set token in localStorage
      await page.evaluate((value) => {
        localStorage.setItem('umak_link_web_api_token', value);
      }, token);

      // Set token in cookies
      await page.context().addCookies([
        {
          name: 'umak_link_web_api_token',
          value: token,
          url: 'http://localhost:3000',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      // Also set the role in localStorage
      await page.evaluate((role) => {
        localStorage.setItem('umak_link_web_role', role);
      }, user.user_type);
    };
    await use(setToken);
  },
});

/**
 * Helper to set auth token directly on a page
 */
async function setAuthToken(page: Page, user: AuthUser): Promise<void> {
  const token = createMockJWT(user);

  // Set token in localStorage
  await page.evaluate((value) => {
    localStorage.setItem('umak_link_web_api_token', value);
  }, token);

  // Set token in cookies
  await page.context().addCookies([
    {
      name: 'umak_link_web_api_token',
      value: token,
      url: 'http://localhost:3000',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Set the role in localStorage
  await page.evaluate((role) => {
    localStorage.setItem('umak_link_web_role', role);
  }, user.user_type);
}

export { setAuthToken };
