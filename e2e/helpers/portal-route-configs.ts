import type { Page } from "@playwright/test";
import type {
  ProtectedRouteSuiteConfig,
  PublicRouteSuiteConfig,
} from "./portal-route-suite";
import {
  RAW_INTERNAL_ERROR,
  SAMPLE_CUSTODY_ATTEMPT_ID,
  SAMPLE_FRAUD_REPORT_ID,
  SAMPLE_POST_ID,
  createSamplePostDetail,
  createApiErrorOverride,
  seedGuardReviewSession,
} from "./portal-route-suite";

const DEFAULT_ACTION_ERROR_MESSAGE =
  "Action didn't succeed, please try again later.";

function createServerErrorOverride(path: string | RegExp, method = "GET") {
  return createApiErrorOverride({
    path,
    method,
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    error: "Internal Server Error",
    rawMessage: RAW_INTERNAL_ERROR,
  });
}

const listPostsErrorOverride = createServerErrorOverride(/^\/posts(?:\?.*)?$/);
const searchItemsErrorOverride = createServerErrorOverride("/search/items/staff", "POST");
const fraudReportsErrorOverride = createServerErrorOverride(
  /^\/fraud-reports(?:\?.*)?$/
);
const guardActiveReviewsErrorOverride = createServerErrorOverride(
  "/guard/reviews/active"
);
const adminUsersErrorOverride = createServerErrorOverride(
  /^\/admin\/users(?:\?.*)?$/
);

const notFoundPostOverrides = [
  createApiErrorOverride({
    path: `/posts/${SAMPLE_POST_ID}/full`,
    statusCode: 404,
    code: "NOT_FOUND",
    error: "Not Found",
    rawMessage: RAW_INTERNAL_ERROR,
  }),
  createApiErrorOverride({
    path: `/posts/${SAMPLE_POST_ID}`,
    statusCode: 404,
    code: "NOT_FOUND",
    error: "Not Found",
    rawMessage: RAW_INTERNAL_ERROR,
  }),
];

async function submitEmptyAnnouncement(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Post Announcement", exact: true }).click();
}

async function submitEmptyCreatePost(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Submit Post", exact: true }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
}

async function submitEmptyStaffSearch(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Search records" }).click();
}

async function submitGuardManualEntry(page: Page): Promise<void> {
  await page.getByLabel("Manual Entry Code").fill("ABC123");
  await page.getByRole("button", { name: "Load Handover Review" }).click();
}

async function submitGuardDecision(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Accept Handover" }).click();
}

async function submitOpenFraudReport(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Open", exact: true }).first().click();
  await page.getByRole("button", { name: "Open", exact: true }).last().click();
}

export const publicPortalRouteConfigs = {
  home: {
    title: "Public route /",
    route: "/",
    successText: "Admin and Staff Portal",
  },
  notAllowed: {
    title: "Public route /not-allowed",
    route: "/not-allowed",
    successText: "Access Not Allowed",
  },
  notFound: {
    title: "Public route /missing-route",
    route: "/missing-route",
    successText: "Page not found.",
  },
} satisfies Record<string, PublicRouteSuiteConfig>;

export const adminPortalRouteConfigs = {
  index: {
    title: "Admin route /admin",
    route: "/admin",
    allowedRole: "Admin",
    successText: "Dashboard",
  },
  dashboard: {
    title: "Admin route /admin/dashboard",
    route: "/admin/dashboard",
    allowedRole: "Admin",
    successText: "Dashboard (Dummy)",
  },
  announcementsList: {
    title: "Admin route /admin/announcement",
    route: "/admin/announcement",
    allowedRole: "Admin",
    successText: "Campus announcement",
  },
  generateAnnouncement: {
    title: "Admin route /admin/generate-announcement",
    route: "/admin/generate-announcement",
    allowedRole: "Admin",
    successText: "Create Announcement",
    errorScenario: {
      overrides: [],
      expectedText: "Title or Message must not be empty",
      action: submitEmptyAnnouncement,
    },
  },
  auditLog: {
    title: "Admin route /admin/audit-log",
    route: "/admin/audit-log",
    allowedRole: "Admin",
    successText: "Audit Trail",
  },
  auditTrail: {
    title: "Admin route /admin/audit-trail",
    route: "/admin/audit-trail",
    allowedRole: "Admin",
    successText: "Audit Trail",
  },
  adminManagement: {
    title: "Admin route /admin/admin-management",
    route: "/admin/admin-management",
    allowedRole: "Admin",
    successText: "User Management",
    errorScenario: {
      overrides: [adminUsersErrorOverride],
      expectedText: "Failed to load users. Please try again.",
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  notifications: {
    title: "Admin route /admin/notifications",
    route: "/admin/notifications",
    allowedRole: "Admin",
    successText: "Notifications",
  },
  profile: {
    title: "Admin route /admin/profile",
    route: "/admin/profile",
    allowedRole: "Admin",
    successText: "My Profile",
  },
  info: {
    title: "Admin route /admin/info",
    route: "/admin/info",
    allowedRole: "Admin",
    successText: "About OHSO",
  },
  staffManagement: {
    title: "Admin route /admin/staff-management",
    route: "/admin/staff-management",
    expectedRoute: "/admin/admin-management",
    allowedRole: "Admin",
    successText: "User Management",
  },
  staffAdd: {
    title: "Admin route /admin/staff/add",
    route: "/admin/staff/add",
    expectedRoute: "/admin/admin-management",
    allowedRole: "Admin",
    successText: "User Management",
  },
} satisfies Record<string, ProtectedRouteSuiteConfig>;

export const staffPortalRouteConfigs = {
  index: {
    title: "Staff route /staff",
    route: "/staff",
    allowedRole: "Staff",
    successText: "Staff Overview",
    errorScenario: {
      overrides: [listPostsErrorOverride],
      expectedText: DEFAULT_ACTION_ERROR_MESSAGE,
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  dashboard: {
    title: "Staff route /staff/dashboard",
    route: "/staff/dashboard",
    allowedRole: "Staff",
    successText: "Staff Overview",
    errorScenario: {
      overrides: [listPostsErrorOverride],
      expectedText: DEFAULT_ACTION_ERROR_MESSAGE,
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  home: {
    title: "Staff route /staff/home",
    route: "/staff/home",
    allowedRole: "Staff",
    successText: "Staff Home (Dummy)",
  },
  postRecords: {
    title: "Staff route /staff/post-records",
    route: "/staff/post-records",
    allowedRole: "Staff",
    successText: "Post Records",
    errorScenario: {
      overrides: [listPostsErrorOverride],
      expectedText: DEFAULT_ACTION_ERROR_MESSAGE,
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  postRecordView: {
    title: "Staff route /staff/post-record/view/:postId",
    route: `/staff/post-record/view/${SAMPLE_POST_ID}`,
    allowedRole: "Staff",
    successText: "Post Details",
    errorScenario: {
      overrides: notFoundPostOverrides,
      expectedText: "Page not found.",
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  postClaim: {
    title: "Staff route /staff/post/claim/:postId",
    route: `/staff/post/claim/${SAMPLE_POST_ID}`,
    allowedRole: "Staff",
    successText: "Black Wallet",
    errorScenario: {
      overrides: notFoundPostOverrides,
      expectedText: "Post not found or cannot be claimed",
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  createPost: {
    title: "Staff route /staff/post/create",
    route: "/staff/post/create",
    allowedRole: "Staff",
    successText: "Create Staff Post",
    errorScenario: {
      overrides: [],
      expectedText: "Please fill in all required fields.",
      action: submitEmptyCreatePost,
    },
  },
  search: {
    title: "Staff route /staff/search",
    route: "/staff/search",
    allowedRole: "Staff",
    successText: "Search Query",
    errorScenario: {
      overrides: [],
      expectedText: "Enter a keyword or upload an image first.",
      action: submitEmptyStaffSearch,
    },
  },
  searchResults: {
    title: "Staff route /staff/search/results",
    route: "/staff/search/results?q=wallet",
    allowedRole: "Staff",
    successText: "Black Wallet",
    errorScenario: {
      overrides: [searchItemsErrorOverride],
      expectedText: DEFAULT_ACTION_ERROR_MESSAGE,
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  fraudReports: {
    title: "Staff route /staff/fraud-reports",
    route: "/staff/fraud-reports",
    allowedRole: "Staff",
    successText: "Fraud Reports",
    errorScenario: {
      overrides: [fraudReportsErrorOverride],
      expectedText: DEFAULT_ACTION_ERROR_MESSAGE,
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  fraudReportView: {
    title: "Staff route /staff/fraud-report/view/:reportId",
    route: `/staff/fraud-report/view/${SAMPLE_FRAUD_REPORT_ID}`,
    allowedRole: "Staff",
    successText: "Black Wallet",
    errorScenario: {
      overrides: [
        createApiErrorOverride({
          path: `/fraud-reports/${SAMPLE_FRAUD_REPORT_ID}/status`,
          method: "PUT",
          statusCode: 500,
          code: "INTERNAL_SERVER_ERROR",
          error: "Internal Server Error",
          rawMessage: RAW_INTERNAL_ERROR,
        }),
      ],
      expectedText: DEFAULT_ACTION_ERROR_MESSAGE,
      rawText: RAW_INTERNAL_ERROR,
      action: submitOpenFraudReport,
    },
  },
  notifications: {
    title: "Staff route /staff/notifications",
    route: "/staff/notifications",
    allowedRole: "Staff",
    successText: "Notifications",
  },
  profile: {
    title: "Staff route /staff/profile",
    route: "/staff/profile",
    allowedRole: "Staff",
    successText: "My Profile",
  },
  info: {
    title: "Staff route /staff/info",
    route: "/staff/info",
    allowedRole: "Staff",
    successText: "About OHSO",
  },
} satisfies Record<string, ProtectedRouteSuiteConfig>;

export const guardPortalRouteConfigs = {
  index: {
    title: "Guard route /guard",
    route: "/guard",
    allowedRole: "Guard",
    successText: "Guard Handover",
  },
  activeReviews: {
    title: "Guard route /guard/active-reviews",
    route: "/guard/active-reviews",
    allowedRole: "Guard",
    successText: "Black Wallet",
    errorScenario: {
      overrides: [guardActiveReviewsErrorOverride],
      expectedText: DEFAULT_ACTION_ERROR_MESSAGE,
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  postRecordView: {
    title: "Guard route /guard/post-record/view/:postId",
    route: `/guard/post-record/view/${SAMPLE_POST_ID}`,
    allowedRole: "Guard",
    successText: "Post Details",
    errorScenario: {
      overrides: notFoundPostOverrides,
      expectedText: "Post not found or not available for guard review",
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  postClaim: {
    title: "Guard route /guard/post/claim/:postId",
    route: `/guard/post/claim/${SAMPLE_POST_ID}`,
    allowedRole: "Guard",
    successOverrides: [
      {
        path: `/posts/${SAMPLE_POST_ID}/full`,
        method: "GET",
        statusCode: 200,
        body: createSamplePostDetail(SAMPLE_POST_ID, {
          custody_status: "with_guard",
          accepted_by_guard_name: "Guard User",
          accepted_by_guard_email: "guard@umak.edu.ph",
        }),
      },
    ],
    successText: "Claim Verification",
    errorScenario: {
      overrides: [
        createApiErrorOverride({
          path: "/claims/verification-sessions",
          method: "POST",
          statusCode: 403,
          code: "FORBIDDEN",
          error: "Forbidden",
          rawMessage: RAW_INTERNAL_ERROR,
        }),
      ],
      expectedText: "You are not allowed to do this action.",
      rawText: RAW_INTERNAL_ERROR,
    },
  },
  scan: {
    title: "Guard route /guard/scan",
    route: "/guard/scan",
    allowedRole: "Guard",
    successText: "Manual Entry",
    errorScenario: {
      overrides: [
        createApiErrorOverride({
          path: "/guard/custody/scan",
          method: "POST",
          statusCode: 429,
          code: "RATE_LIMITED",
          error: "Rate Limited",
          rawMessage: RAW_INTERNAL_ERROR,
          retryAfterSeconds: 5,
        }),
      ],
      expectedText:
        "You are doing this too fast, please wait 5 seconds before doing the next action.",
      rawText: RAW_INTERNAL_ERROR,
      action: submitGuardManualEntry,
    },
  },
  scanReview: {
    title: "Guard route /guard/scan/review/:custodyAttemptId",
    route: `/guard/scan/review/${SAMPLE_CUSTODY_ATTEMPT_ID}`,
    allowedRole: "Guard",
    successSetup: seedGuardReviewSession,
    successText: "Review Handover",
    errorScenario: {
      overrides: [
        createApiErrorOverride({
          path: `/guard/custody/attempts/${SAMPLE_CUSTODY_ATTEMPT_ID}/decision`,
          method: "POST",
          statusCode: 403,
          code: "FORBIDDEN",
          error: "Forbidden",
          rawMessage: RAW_INTERNAL_ERROR,
        }),
      ],
      expectedText: "You are not allowed to do this action.",
      rawText: RAW_INTERNAL_ERROR,
      action: submitGuardDecision,
    },
  },
  notifications: {
    title: "Guard route /guard/notifications",
    route: "/guard/notifications",
    allowedRole: "Guard",
    successText: "Notifications",
  },
  profile: {
    title: "Guard route /guard/profile",
    route: "/guard/profile",
    allowedRole: "Guard",
    successText: "My Profile",
  },
} satisfies Record<string, ProtectedRouteSuiteConfig>;
