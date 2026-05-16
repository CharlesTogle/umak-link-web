import type { Page, Route } from "@playwright/test";
import { expect } from "@playwright/test";
import { test } from "../fixtures/index";
import type { AuthUser } from "@/types/auth";

const API_BASE_URL = "http://localhost:8080";
const FALLBACK_SUPABASE_PROJECT_REF = "yqgpyvfpgvgecjlpzzgd";

export const SAMPLE_POST_ID = "101";
export const SAMPLE_FRAUD_REPORT_ID = "report-201";
export const SAMPLE_CUSTODY_ATTEMPT_ID = "attempt-001";
export const SAMPLE_CLAIM_VERIFICATION_SESSION_ID = "verification-101";
export const SAMPLE_ITEM_ID = "item-101";
export const SAMPLE_ITEM_NAME = "Black Wallet";
export const RAW_INTERNAL_ERROR = "relation internal_admin_only_table does not exist";

type PortalRole = "Admin" | "Staff" | "Guard";

export interface ApiOverride {
  method?: string;
  path: string | RegExp;
  statusCode: number;
  body: unknown;
}

export interface ErrorScenario {
  overrides: ApiOverride[];
  expectedText: string;
  rawText?: string;
  setup?: (page: Page) => Promise<void>;
  action?: (page: Page) => Promise<void>;
}

export interface ProtectedRouteSuiteConfig {
  title: string;
  route: string;
  allowedRole: PortalRole;
  expectedRoute?: string;
  successText?: string;
  successOverrides?: ApiOverride[];
  successSetup?: (page: Page) => Promise<void>;
  errorScenario?: ErrorScenario;
}

export interface PublicRouteSuiteConfig {
  title: string;
  route: string;
  expectedRoute?: string;
  successText?: string;
}

function absoluteRoute(path: string): string {
  return new URL(path, "http://localhost:3000").toString();
}

function createMockJWT(user: AuthUser): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64");
  const payload = Buffer.from(
    JSON.stringify({
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      user_type: user.user_type,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    })
  ).toString("base64");

  return `${header}.${payload}.mock_signature`;
}

function getSupabaseStorageKey(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return `sb-${FALLBACK_SUPABASE_PROJECT_REF}-auth-token`;
  }

  try {
    const hostname = new URL(supabaseUrl).hostname;
    const projectRef = hostname.split(".")[0];
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
    refresh_token: "mock_refresh_token",
    expires_at: expiresAt,
    expires_in: 86400 * 7,
    token_type: "bearer",
    user: {
      id: user.user_id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      phone: "",
      app_metadata: {
        provider: "google",
        providers: ["google"],
      },
      user_metadata: {
        full_name: user.user_name,
        avatar_url: user.profile_picture_url,
        user_type: user.user_type,
      },
      identities: [],
      created_at: "2026-05-16T08:00:00.000Z",
      updated_at: "2026-05-16T08:00:00.000Z",
    },
  };
}

async function bootstrapAuthenticatedPortalUser(
  page: Page,
  user: AuthUser
): Promise<void> {
  const token = createMockJWT(user);
  const supabaseStorageKey = getSupabaseStorageKey();
  const supabaseSession = createMockSupabaseSession(user, token);

  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user }),
    });
  });

  await page.addInitScript(
    ({ accessToken, roleValue, storageKey, sessionValue }) => {
      if (window.sessionStorage.getItem("__portal_auth_seeded__") === "1") {
        return;
      }

      window.localStorage.setItem("umak_link_web_api_token", accessToken);
      window.localStorage.setItem("umak_link_web_role", roleValue);

      if (storageKey && sessionValue) {
        window.localStorage.setItem(storageKey, sessionValue);
      }

      window.sessionStorage.setItem("__portal_auth_seeded__", "1");
    },
    {
      accessToken: token,
      roleValue: user.user_type,
      storageKey: supabaseStorageKey,
      sessionValue: supabaseStorageKey ? JSON.stringify(supabaseSession) : null,
    }
  );

  await page.context().addCookies([
    {
      name: "umak_link_web_api_token",
      value: token,
      url: "http://localhost:3000",
      sameSite: "Lax",
    },
  ]);
}

function getApiErrorResponse(params: {
  statusCode: number;
  code: string;
  error: string;
  rawMessage?: string;
  retryAfterSeconds?: number;
}) {
  return {
    statusCode: params.statusCode,
    error: params.error,
    code: params.code,
    message: params.rawMessage ?? params.error,
    ...(typeof params.retryAfterSeconds === "number"
      ? { retryAfterSeconds: params.retryAfterSeconds }
      : {}),
  };
}

export function createApiErrorOverride(params: {
  path: string | RegExp;
  statusCode: number;
  code: string;
  error: string;
  method?: string;
  rawMessage?: string;
  retryAfterSeconds?: number;
}): ApiOverride {
  return {
    path: params.path,
    method: params.method ?? "GET",
    statusCode: params.statusCode,
    body: getApiErrorResponse(params),
  };
}

function sampleNotification() {
  return {
    notification_id: "notification-101",
    user_id: "staff-001",
    title: "Test Match Notification",
    body: "A possible match was found for Black Wallet.",
    description: "Review the possible match in UMak-LINK.",
    sent_to: "staff-001",
    sent_by: "admin-001",
    type: "match",
    data: { postId: SAMPLE_POST_ID, itemId: SAMPLE_ITEM_ID },
    is_read: false,
    created_at: "2026-05-16T06:00:00.000Z",
    image_url: "https://example.com/item-101.jpg",
  };
}

function sampleAnnouncement() {
  return {
    id: 1,
    message: "Campus announcement",
    description: "Security Office hours are extended this week.",
    created_at: "2026-05-16T06:00:00.000Z",
    image_url: null,
  };
}

function sampleAuditLog() {
  return {
    audit_id: "audit-101",
    user_id: "admin-001",
    action: "LOGIN",
    table_name: "user_table",
    record_id: "admin-001",
    changes: { action: "LOGIN" },
    timestamp: "2026-05-16T06:00:00.000Z",
    user_table: {
      user_id: "admin-001",
      user_name: "Admin User",
      email: "admin@umak.edu.ph",
      profile_picture_url: null,
    },
  };
}

function samplePost(postId = SAMPLE_POST_ID, overrides: Record<string, unknown> = {}) {
  return {
    post_id: Number(postId),
    item_id: SAMPLE_ITEM_ID,
    poster_name: "Student Owner",
    poster_id: "user-101",
    poster_profile_picture_url: null,
    profile_picture_url: null,
    item_name: SAMPLE_ITEM_NAME,
    item_description: "A black leather wallet with school ID and folded receipts.",
    item_type: "found",
    item_image_url: "https://example.com/item-101.jpg",
    category: "Accessories",
    last_seen_at: "2026-05-15T11:23:00.000Z",
    last_seen_location: "Main Gate",
    submission_date: "2026-05-15T11:25:00.000Z",
    post_status: "accepted",
    item_status: "unclaimed",
    is_anonymous: false,
    accepted_on_date: "2026-05-15T12:00:00.000Z",
    accepted_by_staff_name: "Staff User",
    accepted_by_staff_email: "staff@umak.edu.ph",
    custody_status: "in_security_office",
    claim_id: null,
    claimed_by_name: null,
    claimed_by_email: null,
    claimed_by_contact: null,
    claimed_at: null,
    claim_processed_by_staff_id: null,
    ...overrides,
  };
}

export function createSamplePostDetail(
  postId = SAMPLE_POST_ID,
  overrides: Record<string, unknown> = {}
) {
  return {
    post_id: Number(postId),
    poster_id: "user-101",
    post_status: "accepted",
    item_id: SAMPLE_ITEM_ID,
    is_anonymous: false,
    submitted_on_date_local: "2026-05-15T11:25:00.000Z",
    rejection_reason: null,
    accepted_on_date_local: "2026-05-15T12:00:00.000Z",
    last_seen_date: "2026-05-15",
    last_seen_time: "11:23 AM",
    last_seen_at: "2026-05-15T11:23:00.000Z",
    last_seen_location: "Main Gate",
    item_name: SAMPLE_ITEM_NAME,
    item_description: "A black leather wallet with school ID and folded receipts.",
    image_id: "image-101",
    item_image_url: "https://example.com/item-101.jpg",
    item_status: "unclaimed",
    item_type: "found",
    category: "Accessories",
    custody_status: "in_security_office",
    poster_name: "Student Owner",
    poster_email: "student.owner@umak.edu.ph",
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
    ...overrides,
  };
}

function sampleFraudReport(reportId = SAMPLE_FRAUD_REPORT_ID) {
  return {
    report_id: reportId,
    post_id: Number(SAMPLE_POST_ID),
    report_status: "under_review",
    reason_for_reporting: "Claimed by another user",
    date_reported: "2026-05-16T06:00:00.000Z",
    created_at: "2026-05-16T06:00:00.000Z",
    proof_image_url: null,
    poster_id: "user-101",
    post_status: "accepted",
    item_id: SAMPLE_ITEM_ID,
    is_anonymous: false,
    last_seen_at: "2026-05-15T11:23:00.000Z",
    last_seen_location: "Main Gate",
    item_name: SAMPLE_ITEM_NAME,
    item_description: "A black leather wallet with school ID and folded receipts.",
    item_image_url: "https://example.com/item-101.jpg",
    item_status: "claimed",
    item_type: "found",
    category: "Accessories",
    claimer_name: "Claimant Student",
    claimer_school_email: "claimant@umak.edu.ph",
    claimer_contact_num: "09123456789",
    claimed_at: "2026-05-16T07:00:00.000Z",
    claim_id: "claim-101",
    linked_lost_item_id: null,
    reporter_id: "staff-001",
    reporter_name: "Staff User",
    reporter_profile_picture_url: null,
    poster_name: "Student Owner",
    poster_profile_picture_url: null,
    fraud_reviewer_id: "staff-001",
    fraud_reviewer_name: "Staff User",
    fraud_reviewer_email: "staff@umak.edu.ph",
    submitted_on_date_local: "2026-05-15T11:25:00.000Z",
    accepted_on_date_local: "2026-05-15T12:00:00.000Z",
    last_seen_date: "2026-05-15",
    last_seen_time: "11:23 AM",
    image_id: "image-101",
    claim_processed_by_name: "Staff User",
    claim_processed_by_email: "staff@umak.edu.ph",
    claim_processed_by_profile_picture_url: null,
    reporter_email: "staff@umak.edu.ph",
    poster_email: "student.owner@umak.edu.ph",
    fraud_reviewer_profile_picture_url: null,
  };
}

function sampleUserSearchResult() {
  return {
    user_id: "user-claim-101",
    user_name: "Claimant Student",
    email: "claimant@umak.edu.ph",
    profile_picture_url: null,
    user_type: "User",
  };
}

function sampleGuardActiveReview() {
  return {
    post_id: Number(SAMPLE_POST_ID),
    item_id: SAMPLE_ITEM_ID,
    item_name: SAMPLE_ITEM_NAME,
    item_description: "A black leather wallet with school ID and folded receipts.",
    item_image_url: "https://example.com/item-101.jpg",
    category: "Accessories",
    last_seen_at: "2026-05-15T11:23:00.000Z",
    last_seen_location: "Main Gate",
    poster_name: "Student Owner",
    poster_profile_picture_url: null,
    submitted_on_date_local: "2026-05-15T11:25:00.000Z",
    custody_status: "with_guard",
    post_status: "accepted",
    item_status: "unclaimed",
  };
}

function sampleGuardScanResponse() {
  return {
    qr_code_session_id: "qr-session-101",
    custody_attempt_id: SAMPLE_CUSTODY_ATTEMPT_ID,
    post_id: Number(SAMPLE_POST_ID),
    item_id: SAMPLE_ITEM_ID,
    item_name: SAMPLE_ITEM_NAME,
    item_description: "A black leather wallet with school ID and folded receipts.",
    item_image_url: "https://example.com/item-101.jpg",
    handover_image_url: "https://example.com/handover-101.jpg",
    category: "Accessories",
    last_seen_at: "2026-05-15T11:23:00.000Z",
    last_seen_location: "Main Gate",
    submission_date: "2026-05-15T11:25:00.000Z",
    guard_post_id: "guard-post-101",
    guard_post_name: "Main Gate",
    attempt_number: 1,
    custody_status: "handover_in_progress",
    qr_status: "active",
    attempt_status: "open",
  };
}

function sampleGuardDecisionResponse() {
  return {
    custody_attempt_id: SAMPLE_CUSTODY_ATTEMPT_ID,
    qr_code_session_id: "qr-session-101",
    attempt_status: "accepted",
    qr_status: "accepted",
    custody_status: "with_guard",
    decision_at: "2026-05-16T07:00:00.000Z",
  };
}

function sampleClaimVerificationSession(status: "awaiting_claimer" | "scanned" = "scanned") {
  return {
    claim_verification_session_id: SAMPLE_CLAIM_VERIFICATION_SESSION_ID,
    found_post_id: Number(SAMPLE_POST_ID),
    item_id: SAMPLE_ITEM_ID,
    join_code: "ABC123",
    status,
    qr_status: status === "scanned" ? "scanned" : "active",
    expires_at: "2026-05-16T09:00:00.000Z",
    scanned_at: status === "scanned" ? "2026-05-16T07:30:00.000Z" : null,
    completed_at: null,
    closed_at: null,
    current_window_expired: false,
    can_retry: false,
    verified_claimer:
      status === "scanned"
        ? {
            user_id: "user-claim-101",
            user_name: "Claimant Student",
            email: "claimant@umak.edu.ph",
            profile_picture_url: null,
          }
        : null,
    number_of_attempts: 1,
    max_number_of_attempts: 5,
    retries_remaining: 4,
  };
}

function sampleCustodyHistory(postId = SAMPLE_POST_ID) {
  return {
    post_id: Number(postId),
    item_id: SAMPLE_ITEM_ID,
    post_status: "accepted",
    custody_status: "with_guard",
    history: [
      {
        history_id: "history-101",
        event_type: "guard_accepted",
        source_record_type: "custody_history",
        message: "The guard accepted the handover.",
        occurred_at: "2026-05-16T07:00:00.000Z",
        custody_attempt_id: SAMPLE_CUSTODY_ATTEMPT_ID,
        qr_code_session_id: "qr-session-101",
        attempt_number: 1,
        guard_post_id: "guard-post-101",
        guard_post_name: "Main Gate",
        full_location_name: "Main Gate",
        handover_image_url: "https://example.com/handover-101.jpg",
        actor_user_id: "guard-001",
        actor_name: "Guard User",
        decision_reason: "Item matches the evidence.",
        discard_reason: null,
      },
    ],
  };
}

function matchesOverride(override: ApiOverride, method: string, path: string): boolean {
  const normalizedMethod = (override.method ?? "GET").toUpperCase();
  if (normalizedMethod !== method) return false;

  if (typeof override.path === "string") {
    return path === override.path;
  }

  return override.path.test(path);
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function installPortalApiMocks(
  page: Page,
  overrides: ApiOverride[] = []
): Promise<void> {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = new URL(request.url());
    const path = `${url.pathname}${url.search}`;

    if (url.pathname === "/auth/me") {
      await route.fallback();
      return;
    }

    for (const override of overrides) {
      if (matchesOverride(override, method, path)) {
        await fulfillJson(route, override.body, override.statusCode);
        return;
      }
    }

    if (method === "GET" && url.pathname === "/notifications/count") {
      await fulfillJson(route, { unread_count: 1 });
      return;
    }

    if (method === "GET" && url.pathname === "/notifications") {
      await fulfillJson(route, { notifications: [sampleNotification()] });
      return;
    }

    if (method === "PATCH" && /^\/notifications\/[^/]+\/read$/.test(url.pathname)) {
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === "DELETE" && /^\/notifications\/[^/]+$/.test(url.pathname)) {
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === "POST" && url.pathname === "/notifications/send") {
      await fulfillJson(route, { success: true, notification_id: 1 });
      return;
    }

    if (method === "GET" && url.pathname === "/announcements") {
      await fulfillJson(route, { announcements: [sampleAnnouncement()], count: 1 });
      return;
    }

    if (method === "POST" && url.pathname === "/announcements/send") {
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === "GET" && url.pathname === "/admin/audit-logs") {
      await fulfillJson(route, { logs: [sampleAuditLog()] });
      return;
    }

    if (method === "POST" && url.pathname === "/admin/audit-logs") {
      await fulfillJson(route, { success: true, audit_id: "audit-101" });
      return;
    }

    if (method === "GET" && url.pathname === "/admin/dashboard-stats") {
      await fulfillJson(route, {
        pending_verifications: 1,
        pending_fraud_reports: 1,
        claimed_count: 0,
        unclaimed_count: 1,
        to_review_count: 1,
        lost_count: 0,
        returned_count: 0,
        reported_count: 1,
      });
      return;
    }

    if (method === "GET" && url.pathname === "/admin/stats/weekly") {
      await fulfillJson(route, {
        weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
        series: {
          missing: [1, 2, 1, 0],
          found: [0, 1, 1, 1],
          reports: [0, 1, 0, 0],
          pending: [1, 1, 1, 1],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/admin/stats/export") {
      await fulfillJson(route, {
        rows: [
          {
            poster_name: "Student Owner",
            item_name: SAMPLE_ITEM_NAME,
            item_description: "A black leather wallet with school ID and folded receipts.",
            last_seen_location: "Main Gate",
            accepted_by_staff_name: "Staff User",
            submission_date: "2026-05-15T11:25:00.000Z",
            claimed_by_name: "",
            claimed_by_email: "",
            accepted_on_date: "2026-05-15T12:00:00.000Z",
          },
        ],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/admin/users") {
      await fulfillJson(route, {
        users: [
          {
            user_id: "staff-001",
            user_name: "Staff User",
            email: "staff@umak.edu.ph",
            profile_picture_url: null,
            user_type: "Staff",
            created_at: "2026-05-01T00:00:00.000Z",
            last_login: "2026-05-16T06:00:00.000Z",
          },
          {
            user_id: "admin-001",
            user_name: "Admin User",
            email: "admin@umak.edu.ph",
            profile_picture_url: null,
            user_type: "Admin",
            created_at: "2026-05-01T00:00:00.000Z",
            last_login: "2026-05-16T06:00:00.000Z",
          },
        ],
      });
      return;
    }

    if (method === "PUT" && /^\/admin\/users\/[^/]+\/role$/.test(url.pathname)) {
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === "GET" && url.pathname === "/posts/count") {
      await fulfillJson(route, { count: 1 });
      return;
    }

    if (method === "GET" && /^\/posts\/by-item-details\/[^/]+$/.test(url.pathname)) {
      await fulfillJson(route, createSamplePostDetail());
      return;
    }

    if (method === "GET" && /^\/posts\/by-item\/[^/]+$/.test(url.pathname)) {
      await fulfillJson(route, samplePost());
      return;
    }

    if (method === "GET" && /^\/posts\/[^/]+\/full$/.test(url.pathname)) {
      const postId = url.pathname.split("/")[2] ?? SAMPLE_POST_ID;
      await fulfillJson(route, createSamplePostDetail(postId));
      return;
    }

    if (method === "GET" && /^\/posts\/[^/]+$/.test(url.pathname)) {
      const postId = url.pathname.split("/")[2] ?? SAMPLE_POST_ID;
      await fulfillJson(route, samplePost(postId));
      return;
    }

    if (method === "GET" && url.pathname === "/posts") {
      await fulfillJson(route, {
        posts: [samplePost()],
        count: 1,
      });
      return;
    }

    if (method === "PUT" && /^\/posts\/[^/]+\/status$/.test(url.pathname)) {
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === "PUT" && /^\/posts\/items\/[^/]+\/status$/.test(url.pathname)) {
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === "GET" && /^\/custody\/posts\/[^/]+\/history$/.test(url.pathname)) {
      const postId = url.pathname.split("/")[3] ?? SAMPLE_POST_ID;
      await fulfillJson(route, sampleCustodyHistory(postId));
      return;
    }

    if (method === "POST" && url.pathname === "/search/items/staff") {
      await fulfillJson(route, {
        results: [
          {
            post_id: Number(SAMPLE_POST_ID),
            post_status: "accepted",
          },
        ],
      });
      return;
    }

    if (method === "POST" && url.pathname === "/search/image-query") {
      await fulfillJson(route, {
        success: true,
        search_query: "wallet",
      });
      return;
    }

    if (method === "POST" && url.pathname === "/search/match-missing-item") {
      await fulfillJson(route, {
        success: true,
        matches: [],
        total_matches: 0,
      });
      return;
    }

    if (method === "GET" && url.pathname === "/fraud-reports") {
      await fulfillJson(route, {
        reports: [sampleFraudReport()],
        count: 1,
      });
      return;
    }

    if (method === "GET" && /^\/fraud-reports\/[^/]+\/status$/.test(url.pathname)) {
      await fulfillJson(route, { report_status: "under_review" });
      return;
    }

    if (method === "GET" && /^\/fraud-reports\/[^/]+$/.test(url.pathname)) {
      const reportId = url.pathname.split("/")[2] ?? SAMPLE_FRAUD_REPORT_ID;
      await fulfillJson(route, sampleFraudReport(reportId));
      return;
    }

    if (
      (method === "PUT" && /^\/fraud-reports\/[^/]+\/status$/.test(url.pathname)) ||
      (method === "POST" && /^\/fraud-reports\/[^/]+\/resolve$/.test(url.pathname)) ||
      (method === "DELETE" && /^\/fraud-reports\/[^/]+$/.test(url.pathname))
    ) {
      await fulfillJson(route, { success: true, data: {} });
      return;
    }

    if (method === "GET" && url.pathname === "/guard/reviews/active") {
      await fulfillJson(route, { posts: [sampleGuardActiveReview()] });
      return;
    }

    if (method === "POST" && url.pathname === "/guard/custody/scan") {
      await fulfillJson(route, sampleGuardScanResponse());
      return;
    }

    if (method === "POST" && /^\/guard\/custody\/attempts\/[^/]+\/decision$/.test(url.pathname)) {
      await fulfillJson(route, sampleGuardDecisionResponse());
      return;
    }

    if (method === "POST" && url.pathname === "/claims/verification-sessions") {
      await fulfillJson(route, sampleClaimVerificationSession("scanned"));
      return;
    }

    if (method === "GET" && /^\/claims\/verification-sessions\/[^/]+\/status$/.test(url.pathname)) {
      await fulfillJson(route, sampleClaimVerificationSession("scanned"));
      return;
    }

    if (method === "POST" && url.pathname === "/claims/verification-sessions/scan") {
      await fulfillJson(route, {
        claim_verification_session_id: SAMPLE_CLAIM_VERIFICATION_SESSION_ID,
        claim_qr_session_id: "claim-qr-101",
        status: "scanned",
        qr_status: "scanned",
        scanned_at: "2026-05-16T07:30:00.000Z",
        verified_claimer: sampleUserSearchResult(),
      });
      return;
    }

    if (method === "POST" && /^\/claims\/verification-sessions\/[^/]+\/cancel$/.test(url.pathname)) {
      await fulfillJson(route, {
        ...sampleClaimVerificationSession("scanned"),
        claim_qr_session_id: "claim-qr-101",
        cancelled_at: "2026-05-16T07:45:00.000Z",
      });
      return;
    }

    if (method === "POST" && url.pathname === "/claims/process") {
      await fulfillJson(route, { success: true, claim_id: "claim-101" });
      return;
    }

    if (method === "DELETE" && /^\/claims\/by-item\/[^/]+$/.test(url.pathname)) {
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === "GET" && url.pathname === "/users/search") {
      await fulfillJson(route, { results: [sampleUserSearchResult()] });
      return;
    }

    if (method === "GET" && /^\/users\/claim-code\/[^/]+$/.test(url.pathname)) {
      await fulfillJson(route, sampleUserSearchResult());
      return;
    }

    if (method === "POST" && url.pathname === "/staff/custody/security-office/receive") {
      await fulfillJson(route, {
        post_id: Number(SAMPLE_POST_ID),
        custody_attempt_id: SAMPLE_CUSTODY_ATTEMPT_ID,
        custody_status: "in_security_office",
        office_received_at: "2026-05-16T08:00:00.000Z",
      });
      return;
    }

    if (method === "POST" && url.pathname === "/staff/custody/investigations/open") {
      await fulfillJson(route, {
        post_id: Number(SAMPLE_POST_ID),
        custody_attempt_id: SAMPLE_CUSTODY_ATTEMPT_ID,
        custody_status: "under_investigation",
        investigation_opened_at: "2026-05-16T08:05:00.000Z",
      });
      return;
    }

    if (method === "POST" && url.pathname === "/staff/custody/guards/notify") {
      await fulfillJson(route, {
        post_id: Number(SAMPLE_POST_ID),
        custody_attempt_id: SAMPLE_CUSTODY_ATTEMPT_ID,
        guard_id: "guard-001",
        notification_id: "notification-guard-101",
        notification_status: "created",
        requested_at: "2026-05-16T08:10:00.000Z",
      });
      return;
    }

    if (method === "PUT" && url.pathname === "/staff/custody/status") {
      await fulfillJson(route, {
        post_id: Number(SAMPLE_POST_ID),
        item_id: SAMPLE_ITEM_ID,
        custody_status: "under_investigation",
        updated_at: "2026-05-16T08:15:00.000Z",
      });
      return;
    }

    await fulfillJson(route, {}, 200);
  });
}

export async function seedGuardReviewSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ storageKey, session }) => {
      if (window.sessionStorage.getItem("__guard_review_seeded__") === "1") {
        return;
      }

      window.sessionStorage.setItem(storageKey, JSON.stringify(session));
      window.sessionStorage.setItem("__guard_review_seeded__", "1");
    },
    {
      storageKey: "guard.active-scan-session",
      session: {
        scan: sampleGuardScanResponse(),
        scanned_at: "2026-05-16T07:00:00.000Z",
      },
    }
  );
}

function pickRoleUser(
  role: PortalRole,
  users: {
    adminUser: AuthUser;
    staffUser: AuthUser;
    guardUser: AuthUser;
  }
): AuthUser {
  if (role === "Admin") return users.adminUser;
  if (role === "Staff") return users.staffUser;
  return users.guardUser;
}

function pickWrongRoleUser(
  role: PortalRole,
  users: {
    adminUser: AuthUser;
    staffUser: AuthUser;
    guardUser: AuthUser;
  }
): AuthUser {
  if (role === "Admin") return users.staffUser;
  if (role === "Staff") return users.adminUser;
  return users.staffUser;
}

async function assertSuccessState(
  page: Page,
  config: { expectedRoute: string; successText?: string }
): Promise<void> {
  await expect(page).toHaveURL(absoluteRoute(config.expectedRoute));
  await expect(page.locator("body")).toBeVisible();

  if (config.successText) {
    await expect(page.getByText(config.successText, { exact: true }).first()).toBeVisible();
  }
}

async function assertSafeErrorState(
  page: Page,
  config: { expectedText: string; rawText?: string }
): Promise<void> {
  await expect(page.getByText(config.expectedText, { exact: true })).toBeVisible();

  if (config.rawText) {
    await expect(page.locator("body")).not.toContainText(config.rawText);
  }
}

export function buildPublicPortalRouteSuite(
  config: PublicRouteSuiteConfig
): void {
  test.describe(config.title, () => {
    test("success: renders the route", async ({ page }) => {
      await page.goto(config.route);
      await assertSuccessState(page, {
        expectedRoute: config.expectedRoute ?? config.route,
        ...(config.successText ? { successText: config.successText } : {}),
      });
    });
  });
}

export function buildProtectedPortalRouteSuite(
  config: ProtectedRouteSuiteConfig
): void {
  test.describe(config.title, () => {
    test("success: renders the route for the allowed role", async ({
      page,
      adminUser,
      staffUser,
      guardUser,
    }) => {
      await installPortalApiMocks(page, config.successOverrides ?? []);
      await bootstrapAuthenticatedPortalUser(
        page,
        pickRoleUser(config.allowedRole, { adminUser, staffUser, guardUser })
      );

      if (config.successSetup) {
        await config.successSetup(page);
      }

      await page.goto(config.route);
      await assertSuccessState(page, {
        expectedRoute: config.expectedRoute ?? config.route,
        ...(config.successText ? { successText: config.successText } : {}),
      });
    });

    test("error: unauthenticated access redirects to login", async ({
      page,
    }) => {
      await installPortalApiMocks(page);
      await page.goto(config.route);
      await expect(page).toHaveURL(absoluteRoute("/"));
      await expect(page.getByText("Admin and Staff Portal")).toBeVisible();
    });

    test("error: wrong role redirects to not allowed", async ({
      page,
      adminUser,
      staffUser,
      guardUser,
    }) => {
      await installPortalApiMocks(page);
      await bootstrapAuthenticatedPortalUser(
        page,
        pickWrongRoleUser(config.allowedRole, { adminUser, staffUser, guardUser })
      );
      await page.goto(config.route);
      await expect(page).toHaveURL(absoluteRoute("/not-allowed"));
      await expect(page.getByText("Access Not Allowed")).toBeVisible();
    });

    if (config.errorScenario) {
      test("error: shows a safe error state", async ({
        page,
        adminUser,
        staffUser,
        guardUser,
      }) => {
        const scenario = config.errorScenario;
        if (!scenario) {
          throw new Error("Missing error scenario for protected route suite.");
        }
        await installPortalApiMocks(page, [
          ...(config.successOverrides ?? []),
          ...scenario.overrides,
        ]);
        await bootstrapAuthenticatedPortalUser(
          page,
          pickRoleUser(config.allowedRole, { adminUser, staffUser, guardUser })
        );

        if (config.successSetup) {
          await config.successSetup(page);
        }

        if (scenario.setup) {
          await scenario.setup(page);
        }

        await page.goto(config.route);

        if (scenario.action) {
          await scenario.action(page);
        }

        await assertSafeErrorState(page, {
          expectedText: scenario.expectedText,
          ...(scenario.rawText
            ? { rawText: scenario.rawText }
            : {}),
        });
      });
    }
  });
}
