import type { ApiPostRecord, ApiPostRecordDetails } from '@/types/post-record-api';
import { APP_ROUTES } from '../../config/routes';
import { test, expect } from '../../fixtures/index';
import { createMockPost } from '../../helpers/test-data';

test.describe('Staff Claim Flow', () => {
  test('successful staff claim does not flash the blocked claim screen before redirect', async ({
    page,
    staffUser,
  }) => {
    const postId = '2001';
    const supabaseStorageKey = 'sb-yqgpyvfpgvgecjlpzzgd-auth-token';
    const mockAccessToken = 'mock-supabase-access-token';
    const mockRefreshToken = 'mock-supabase-refresh-token';
    let isClaimed = false;

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: staffUser }),
      });
    });

    await page.addInitScript(
      ({ accessToken, refreshToken, storageKey, user }) => {
        const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
        const session = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          expires_in: 60 * 60,
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

        window.localStorage.setItem(storageKey, JSON.stringify(session));
        window.localStorage.setItem('umak_link_web_api_token', accessToken);
        window.localStorage.setItem('umak_link_web_role', user.user_type);
      },
      {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        storageKey: supabaseStorageKey,
        user: staffUser,
      }
    );

    await page.context().addCookies([
      {
        name: 'umak_link_web_api_token',
        value: mockAccessToken,
        url: 'http://localhost:3000',
        sameSite: 'Lax',
      },
    ]);

    const claimablePost = {
      post_id: Number(postId),
      poster_id: 'poster-001',
      post_status: 'accepted',
      item_id: 'ITEM-2001',
      is_anonymous: false,
      submitted_on_date_local: '2026-05-16T08:00:00.000Z',
      rejection_reason: null,
      accepted_on_date_local: '2026-05-16T08:30:00.000Z',
      last_seen_date: '2026-05-15',
      last_seen_time: '10:00',
      last_seen_at: '2026-05-15T10:00:00.000Z',
      last_seen_location: 'Library',
      item_name: 'Blue Water Bottle',
      item_description: 'Stainless water bottle with campus stickers.',
      image_id: null,
      item_image_url: null,
      item_status: 'unclaimed',
      item_type: 'found',
      category: 'Tumbler',
      poster_name: 'Reporter User',
      poster_email: 'reporter@umak.edu.ph',
      poster_profile_picture_url: null,
      claim_id: null,
      claimer_name: null,
      claimer_school_email: null,
      claimer_contact_num: null,
      claimed_at: null,
      claim_processed_by_name: null,
      claim_processed_by_email: null,
      claim_processed_by_profile_picture_url: null,
      claim_processed_by_user_type: null,
      linked_lost_item_id: null,
      returned_at: null,
      accepted_by_guard_name: null,
      accepted_by_guard_email: null,
      custody_status: 'in_security_office',
    } satisfies ApiPostRecordDetails;

    const claimedPost = {
      ...claimablePost,
      item_status: 'claimed',
      claim_id: 'claim-2001',
      claimer_name: 'Jane Student',
      claimer_school_email: 'jane.student@umak.edu.ph',
      claimer_contact_num: '0912 345 6789',
      claimed_at: '2026-05-16T10:30:00.000Z',
      claim_processed_by_name: 'Staff User',
      claim_processed_by_email: 'staff@umak.edu.ph',
      claim_processed_by_user_type: 'Staff',
      custody_status: 'claimed_by_student',
    } satisfies ApiPostRecordDetails;

    const buildPostListRecord = (): ApiPostRecord =>
      createMockPost({
        post_id: Number(postId),
        poster_id: 'poster-001',
        poster_name: 'Reporter User',
        item_id: 'ITEM-2001',
        item_name: 'Blue Water Bottle',
        item_description: 'Stainless water bottle with campus stickers.',
        item_type: 'found',
        post_status: 'accepted',
        item_status: isClaimed ? 'claimed' : 'unclaimed',
        custody_status: isClaimed ? 'claimed_by_student' : 'in_security_office',
        item_image_url: null,
        category: 'Tumbler',
        last_seen_at: '2026-05-15T10:00:00.000Z',
        last_seen_location: 'Library',
        submission_date: '2026-05-16T08:00:00.000Z',
        is_anonymous: false,
      });

    await page.route('**/posts**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }

      const url = new URL(route.request().url());

      if (url.pathname === `/posts/${postId}/full`) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isClaimed ? claimedPost : claimablePost),
        });
        return;
      }

      if (url.pathname === '/posts') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ posts: [buildPostListRecord()] }),
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled posts route in test: ${url.pathname}` }),
      });
    });

    await page.route('**/claims/process', async (route) => {
      isClaimed = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          claim_id: 'claim-2001',
        }),
      });
    });

    await page.goto(`/staff/post/claim/${postId}`);

    await expect(page.getByRole('heading', { name: 'Blue Water Bottle' })).toBeVisible();

    await page.evaluate(() => {
      const win = window as typeof window & {
        __claimBlockedSeen?: boolean;
        __claimBlockedObserver?: MutationObserver;
      };

      win.__claimBlockedSeen =
        document.body?.innerText.includes('Post not ready for claim') ?? false;

      win.__claimBlockedObserver?.disconnect();

      const recordBlockedClaimState = () => {
        if (document.body?.innerText.includes('Post not ready for claim')) {
          win.__claimBlockedSeen = true;
        }
      };

      const observer = new MutationObserver(recordBlockedClaimState);
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      });

      win.__claimBlockedObserver = observer;
    });

    await page.getByRole('button', { name: 'Manual Input' }).click();
    await page.getByPlaceholder('Enter full name').fill('Jane Student');
    await page.getByPlaceholder('user@umak.edu.ph').fill('jane.student@umak.edu.ph');
    await page.getByRole('button', { name: 'Add Claimer' }).click();
    await page.getByPlaceholder('0912 345 6789').fill('09123456789');

    await expect(page.getByRole('button', { name: 'Claim Item' })).toBeEnabled();

    const claimResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/claims/process') &&
      response.status() === 200
    );

    await page.getByRole('button', { name: 'Claim Item' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Claim' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await claimResponsePromise;
    await expect(page.getByRole('status')).toContainText('Item claimed successfully');
    await expect(page).toHaveURL(APP_ROUTES.staff.posts);
    await expect(page.getByRole('heading', { name: 'Post Records' })).toBeVisible();

    const claimBlockedScreenSeen = await page.evaluate(() => {
      const win = window as typeof window & {
        __claimBlockedSeen?: boolean;
        __claimBlockedObserver?: MutationObserver;
      };

      win.__claimBlockedObserver?.disconnect();
      return Boolean(win.__claimBlockedSeen);
    });

    expect(claimBlockedScreenSeen).toBe(false);
  });

  test('blocked staff claim route redirects to the post record without flashing the blocked claim screen', async ({
    page,
    loginAsStaff,
  }) => {
    const postId = '2002';
    const blockedPost = {
      post_id: Number(postId),
      poster_id: 'poster-002',
      post_status: 'accepted',
      item_id: 'ITEM-2002',
      is_anonymous: false,
      submitted_on_date_local: '2026-05-16T08:00:00.000Z',
      rejection_reason: null,
      accepted_on_date_local: '2026-05-16T08:30:00.000Z',
      last_seen_date: '2026-05-15',
      last_seen_time: '10:00',
      last_seen_at: '2026-05-15T10:00:00.000Z',
      last_seen_location: 'Engineering Building',
      item_name: 'Grey Umbrella',
      item_description: 'Compact umbrella tagged by the guard for handoff.',
      image_id: null,
      item_image_url: null,
      item_status: 'unclaimed',
      item_type: 'found',
      category: 'Umbrella',
      poster_name: 'Reporter User',
      poster_email: 'reporter@umak.edu.ph',
      poster_profile_picture_url: null,
      claim_id: null,
      claimer_name: null,
      claimer_school_email: null,
      claimer_contact_num: null,
      claimed_at: null,
      claim_processed_by_name: null,
      claim_processed_by_email: null,
      claim_processed_by_profile_picture_url: null,
      claim_processed_by_user_type: null,
      linked_lost_item_id: null,
      returned_at: null,
      accepted_by_guard_name: 'Guard User',
      accepted_by_guard_email: 'guard@umak.edu.ph',
      custody_status: 'with_guard',
    } satisfies ApiPostRecordDetails;

    await page.addInitScript(() => {
      const blockedTexts = [
        'Post not ready for claim',
        'This found post cannot be claimed until the item is received in the Security Office.',
      ];
      const win = window as typeof window & {
        __claimBlockedSeen?: boolean;
        __claimBlockedObserver?: MutationObserver;
      };

      win.__claimBlockedSeen = false;

      const observeBlockedClaimState = () => {
        const recordBlockedClaimState = () => {
          const bodyText = document.body?.innerText ?? '';
          if (blockedTexts.some((text) => bodyText.includes(text))) {
            win.__claimBlockedSeen = true;
          }
        };

        recordBlockedClaimState();
        const observer = new MutationObserver(recordBlockedClaimState);
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          characterData: true,
        });

        win.__claimBlockedObserver = observer;
      };

      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', observeBlockedClaimState, {
          once: true,
        });
        return;
      }

      observeBlockedClaimState();
    });

    await loginAsStaff();

    await page.route('**/posts**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }

      const url = new URL(route.request().url());

      if (url.pathname === `/custody/posts/${postId}/history`) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            post_id: Number(postId),
            item_id: blockedPost.item_id,
            post_status: blockedPost.post_status,
            custody_status: blockedPost.custody_status,
            history: [],
          }),
        });
        return;
      }

      if (url.pathname === `/posts/${postId}/full`) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(blockedPost),
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled posts route in test: ${url.pathname}` }),
      });
    });

    await page.goto(`/staff/post/claim/${postId}`);

    await expect(page).toHaveURL(APP_ROUTES.staff.viewPost(postId));
    await expect(page.getByRole('heading', { name: 'Grey Umbrella' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Post Details' })).toBeVisible();

    const claimBlockedScreenSeen = await page.evaluate(() => {
      const win = window as typeof window & {
        __claimBlockedSeen?: boolean;
        __claimBlockedObserver?: MutationObserver;
      };

      win.__claimBlockedObserver?.disconnect();
      return Boolean(win.__claimBlockedSeen);
    });

    expect(claimBlockedScreenSeen).toBe(false);
  });
});
