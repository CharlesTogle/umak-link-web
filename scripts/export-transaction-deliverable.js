#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const readline = require("readline");
const { spawn } = require("child_process");
const { chromium } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_DIR = path.resolve(ROOT, "..", "ELECTIVE", "generated-deliverable-no3");
const DEFAULT_DOCX = path.join(DEFAULT_OUTPUT_DIR, "Deliverable-No3_Auto.docx");
const DEFAULT_MANIFEST = path.join(DEFAULT_OUTPUT_DIR, "transaction-manifest.json");
const DEFAULT_SCREENSHOT_DIR = path.join(DEFAULT_OUTPUT_DIR, "screenshots");
const DEFAULT_AUTH_DIR = path.join(DEFAULT_OUTPUT_DIR, "auth");
const DEFAULT_ADMIN_STATE = path.join(DEFAULT_AUTH_DIR, "admin-storage-state.json");
const DEFAULT_STAFF_STATE = path.join(DEFAULT_AUTH_DIR, "staff-storage-state.json");
const DEFAULT_PORT = process.env.CAPTURE_PORT || "3100";
const DEFAULT_BASE_URL = process.env.CAPTURE_BASE_URL || `http://localhost:${DEFAULT_PORT}`;
const PYTHON_BIN = process.env.DOCX_PYTHON || path.resolve(ROOT, "..", ".venv-docx", "bin", "python");

const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#bfdbfe"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <rect x="80" y="80" width="1040" height="640" rx="36" fill="#ffffff" opacity="0.9"/>
  <text x="600" y="390" text-anchor="middle" font-size="48" font-family="Arial, sans-serif" fill="#1e3a8a">UMak-LINK Preview</text>
  <text x="600" y="450" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#475569">Generated mock asset for deliverable export</text>
</svg>
`)}`;

const USERS = {
  admin: {
    user_id: "admin-001",
    user_name: "Admin Secretary",
    email: "admin.secretary@umak.edu.ph",
    profile_picture_url: PLACEHOLDER_IMAGE,
    user_type: "Admin",
    notification_token: null,
  },
  staff: {
    user_id: "staff-001",
    user_name: "Security Staff",
    email: "security.staff@umak.edu.ph",
    profile_picture_url: PLACEHOLDER_IMAGE,
    user_type: "Staff",
    notification_token: null,
  },
};

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }
    parsed[key] = next;
    i += 1;
  }
  return parsed;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function createMockJWT(user) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
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

function buildData() {
  const announcementItems = [
    {
      id: 1,
      message: "Updated claiming hours this week",
      description: "Security Office will accept claims from 8:00 AM to 6:00 PM from Monday to Friday.",
      created_at: "2026-05-03T09:00:00.000Z",
      image_url: PLACEHOLDER_IMAGE,
    },
    {
      id: 2,
      message: "Reminder on evidence checking",
      description: "Staff must verify item photos and email identity before releasing found property.",
      created_at: "2026-05-02T14:30:00.000Z",
      image_url: null,
    },
  ];

  const adminUsers = [
    USERS.admin,
    {
      user_id: "staff-001",
      user_name: "Security Staff",
      email: "security.staff@umak.edu.ph",
      profile_picture_url: PLACEHOLDER_IMAGE,
      user_type: "Staff",
      created_at: "2026-01-10T08:30:00.000Z",
      last_login: "2026-05-05T07:45:00.000Z",
    },
    {
      user_id: "staff-002",
      user_name: "Front Desk Officer",
      email: "frontdesk@umak.edu.ph",
      profile_picture_url: PLACEHOLDER_IMAGE,
      user_type: "Staff",
      created_at: "2026-01-12T08:30:00.000Z",
      last_login: "2026-05-04T10:20:00.000Z",
    },
    {
      user_id: "admin-002",
      user_name: "Portal Administrator",
      email: "portal.admin@umak.edu.ph",
      profile_picture_url: PLACEHOLDER_IMAGE,
      user_type: "Admin",
      created_at: "2026-01-05T08:30:00.000Z",
      last_login: "2026-05-05T09:15:00.000Z",
    },
  ];

  const foundRecordList = [
    {
      post_id: 101,
      item_id: "FOUND-101",
      poster_name: "Juan Dela Cruz",
      poster_id: "user-101",
      poster_profile_picture_url: PLACEHOLDER_IMAGE,
      item_name: "Black Jansport Backpack",
      item_description: "Found near the CCIS lobby with a blue tumbler in the side pocket.",
      item_type: "found",
      item_image_url: PLACEHOLDER_IMAGE,
      category: "Bag",
      last_seen_at: "2026-05-04T08:20:00.000Z",
      last_seen_location: "CCIS Lobby",
      submission_date: "2026-05-04T09:00:00.000Z",
      post_status: "Accepted",
      item_status: "Unclaimed",
      is_anonymous: false,
    },
    {
      post_id: 102,
      item_id: "MISS-102",
      poster_name: "Maria Santos",
      poster_id: "user-102",
      poster_profile_picture_url: PLACEHOLDER_IMAGE,
      item_name: "Rose Gold Tablet",
      item_description: "Missing after afternoon class, with floral cover and student sticker.",
      item_type: "missing",
      item_image_url: PLACEHOLDER_IMAGE,
      category: "Electronics",
      last_seen_at: "2026-05-03T15:45:00.000Z",
      last_seen_location: "Room 402",
      submission_date: "2026-05-03T16:20:00.000Z",
      post_status: "Accepted",
      item_status: "Lost",
      is_anonymous: false,
    },
    {
      post_id: 103,
      item_id: "FOUND-103",
      poster_name: "Anonymous",
      poster_id: "user-103",
      poster_profile_picture_url: null,
      item_name: "Silver Watch",
      item_description: "Turned in by a student after class dismissal.",
      item_type: "found",
      item_image_url: PLACEHOLDER_IMAGE,
      category: "Accessories",
      last_seen_at: "2026-05-02T17:00:00.000Z",
      last_seen_location: "Library",
      submission_date: "2026-05-02T17:30:00.000Z",
      post_status: "Pending",
      item_status: "Unclaimed",
      is_anonymous: true,
    },
  ];

  const foundDetail = {
    post_id: 101,
    poster_id: "user-101",
    post_status: "accepted",
    item_id: "FOUND-101",
    is_anonymous: false,
    submitted_on_date_local: "2026-05-04T09:00:00.000Z",
    rejection_reason: null,
    accepted_on_date_local: "2026-05-04T09:15:00.000Z",
    last_seen_date: "2026-05-04",
    last_seen_time: "08:20",
    last_seen_at: "2026-05-04T08:20:00.000Z",
    last_seen_location: "CCIS Lobby",
    item_name: "Black Jansport Backpack",
    item_description: "Found near the CCIS lobby with a blue tumbler in the side pocket.",
    image_id: "img-found-101",
    item_image_url: PLACEHOLDER_IMAGE,
    item_status: "unclaimed",
    item_type: "found",
    category: "Bag",
    poster_name: "Juan Dela Cruz",
    poster_email: "juan.delacruz@umak.edu.ph",
    poster_profile_picture_url: PLACEHOLDER_IMAGE,
    claim_id: null,
    claimer_name: null,
    claimer_school_email: null,
    claimer_contact_num: null,
    claimed_at: null,
    claim_processed_by_name: null,
    claim_processed_by_email: null,
    claim_processed_by_profile_picture_url: null,
    linked_lost_item_id: null,
    returned_at: null,
  };

  const missingDetail = {
    post_id: 102,
    poster_id: "user-102",
    post_status: "accepted",
    item_id: "MISS-102",
    is_anonymous: false,
    submitted_on_date_local: "2026-05-03T16:20:00.000Z",
    rejection_reason: null,
    accepted_on_date_local: "2026-05-03T16:35:00.000Z",
    last_seen_date: "2026-05-03",
    last_seen_time: "15:45",
    last_seen_at: "2026-05-03T15:45:00.000Z",
    last_seen_location: "Room 402",
    item_name: "Rose Gold Tablet",
    item_description: "Missing after afternoon class, with floral cover and student sticker.",
    image_id: "img-miss-102",
    item_image_url: PLACEHOLDER_IMAGE,
    item_status: "lost",
    item_type: "missing",
    category: "Electronics",
    poster_name: "Maria Santos",
    poster_email: "maria.santos@umak.edu.ph",
    poster_profile_picture_url: PLACEHOLDER_IMAGE,
    claim_id: null,
    claimer_name: null,
    claimer_school_email: null,
    claimer_contact_num: null,
    claimed_at: null,
    claim_processed_by_name: null,
    claim_processed_by_email: null,
    claim_processed_by_profile_picture_url: null,
    linked_lost_item_id: null,
    returned_at: null,
  };

  const fraudList = [
    {
      report_id: "FR-2001",
      post_id: 101,
      report_status: "open",
      reason_for_reporting: "False claim attempt: claimant could not provide matching pocket contents.",
      date_reported: "2026-05-05T07:30:00.000Z",
      proof_image_url: PLACEHOLDER_IMAGE,
      item_name: "Black Jansport Backpack",
      item_description: foundDetail.item_description,
      item_image_url: PLACEHOLDER_IMAGE,
      claimer_name: "Alex Perez",
      claimer_school_email: "alex.perez@umak.edu.ph",
      claimer_contact_num: "0912 345 6789",
      claimed_at: "2026-05-05T06:45:00.000Z",
      reporter_id: "user-210",
      reporter_name: "Concerned Student",
      reporter_profile_picture_url: PLACEHOLDER_IMAGE,
      poster_name: foundDetail.poster_name,
      poster_profile_picture_url: PLACEHOLDER_IMAGE,
      fraud_reviewer_id: "staff-001",
      fraud_reviewer_name: USERS.staff.user_name,
      fraud_reviewer_email: USERS.staff.email,
      claim_processed_by_name: "Security Staff",
      claim_processed_by_email: "security.staff@umak.edu.ph",
      claim_processed_by_profile_picture_url: PLACEHOLDER_IMAGE,
    },
  ];

  const fraudDetail = {
    ...fraudList[0],
    status: "open",
    post_status: "accepted",
    item_id: "FOUND-101",
    is_anonymous: false,
    last_seen_at: foundDetail.last_seen_at,
    last_seen_location: foundDetail.last_seen_location,
    item_status: "claimed",
    item_type: "found",
    category: foundDetail.category,
    linked_lost_item_id: "MISS-900",
    submitted_on_date_local: foundDetail.submitted_on_date_local,
    accepted_on_date_local: foundDetail.accepted_on_date_local,
    last_seen_date: foundDetail.last_seen_date,
    last_seen_time: foundDetail.last_seen_time,
    image_id: foundDetail.image_id,
    reporter_email: "concerned.student@umak.edu.ph",
    poster_email: foundDetail.poster_email,
    fraud_reviewer_profile_picture_url: PLACEHOLDER_IMAGE,
  };

  const linkedMissingItem = {
    ...missingDetail,
    post_id: 900,
    item_id: "MISS-900",
    item_name: "Backpack Owner Report",
    item_description: "Missing report linked to the black backpack claim dispute.",
  };

  const notifications = [
    {
      notification_id: 1,
      user_id: "staff-001",
      title: "Claim request ready for review",
      body: "A found backpack has reached the claim-verification stage.",
      description: "Open the post record and confirm the claimer credentials.",
      type: "progress",
      data: { href: "/staff/post-record/view/101" },
      is_read: false,
      created_at: "2026-05-05T08:15:00.000Z",
      image_url: PLACEHOLDER_IMAGE,
    },
    {
      notification_id: 2,
      user_id: "staff-001",
      title: "Fraud report opened",
      body: "Report FR-2001 is assigned to you for investigation.",
      description: "Review the claim details and decide whether to keep or delete the claim.",
      type: "message",
      data: { href: "/staff/fraud-report/view/FR-2001" },
      is_read: false,
      created_at: "2026-05-05T08:45:00.000Z",
      image_url: null,
    },
    {
      notification_id: 3,
      user_id: "staff-001",
      title: "Global announcement",
      body: "The portal now requires complete evidence before release.",
      description: "Please follow the updated item release checklist.",
      type: "global_announcement",
      data: {},
      is_read: true,
      created_at: "2026-05-04T12:00:00.000Z",
      image_url: null,
    },
  ];

  return {
    announcementItems,
    adminUsers,
    foundRecordList,
    foundDetail,
    missingDetail,
    fraudList,
    fraudDetail,
    linkedMissingItem,
    notifications,
  };
}

function buildSections(args = {}) {
  const foundPostId = args["found-post-id"] || "101";
  const missingPostId = args["missing-post-id"] || "102";
  const claimPostId = args["claim-post-id"] || foundPostId;
  const fraudReportId = args["fraud-report-id"] || "FR-2001";

  return [
    {
      title: "A. ADMIN DASHBOARD",
      description: "On this page the admin / college secretary can monitor portal-wide activity and pending work items.",
      layout: "single",
      shots: [
        {
          name: "admin-dashboard",
          role: "admin",
          route: "/admin",
        },
      ],
    },
    {
      title: "B. ANNOUNCEMENT AND USER MANAGEMENT",
      description: "On these pages the admin can manage user roles, review announcements, and create new system-wide notices.",
      layout: "grid",
      shots: [
        {
          name: "admin-user-management",
          role: "admin",
          route: "/admin/admin-management",
        },
        {
          name: "admin-announcements",
          role: "admin",
          route: "/admin/announcement",
        },
        {
          name: "admin-create-announcement",
          role: "admin",
          route: "/admin/generate-announcement",
        },
      ],
    },
    {
      title: "C. POST REVIEW AND CLAIM PROCESS",
      description: "On these pages the staff can review submitted posts, update status, notify owners, and process claims.",
      layout: "grid",
      shots: [
        {
          name: "staff-post-records",
          role: "staff",
          route: "/staff/post-records",
        },
        {
          name: "staff-post-status-modal",
          role: "staff",
          route: `/staff/post-record/view/${foundPostId}`,
          beforeScreenshot: async (page) => {
            await page.getByRole("button", { name: /change status/i }).click();
            await page.waitForTimeout(300);
          },
        },
        {
          name: "staff-notify-owner-modal",
          role: "staff",
          route: `/staff/post-record/view/${missingPostId}`,
          beforeScreenshot: async (page) => {
            await page.getByRole("button", { name: /notify owner/i }).click();
            await page.waitForTimeout(300);
          },
        },
        {
          name: "staff-claim-process",
          role: "staff",
          route: `/staff/post/claim/${claimPostId}`,
        },
      ],
    },
    {
      title: "D. FRAUD REPORTS AND NOTIFICATIONS",
      description: "On these pages the staff can investigate fraud reports and review system notifications related to transactions.",
      layout: "grid",
      shots: [
        {
          name: "staff-fraud-reports",
          role: "staff",
          route: "/staff/fraud-reports",
        },
        {
          name: "staff-fraud-report-detail",
          role: "staff",
          route: `/staff/fraud-report/view/${fraudReportId}`,
        },
        {
          name: "staff-notifications",
          role: "staff",
          route: "/staff/notifications",
        },
      ],
    },
  ];
}

async function waitForUrlReady(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  while (Date.now() < deadline) {
    const ready = await new Promise((resolve) => {
      const req = client.request(
        {
          method: "GET",
          hostname: target.hostname,
          port: target.port,
          path: target.pathname,
          timeout: 2000,
        },
        (res) => {
          res.resume();
          resolve(res.statusCode && res.statusCode < 500);
        }
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });

    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function startDevServer(port) {
  const child = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port), "--webpack"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
  });

  return child;
}

function createPromptInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function waitForEnter(message) {
  const rl = createPromptInterface();

  try {
    await new Promise((resolve) => {
      rl.question(message, () => resolve());
    });
  } finally {
    rl.close();
  }
}

async function setupMockRoutes(page, data, user) {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user }),
    });
  });

  await page.route("**/notifications/count", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ unread_count: 4 }),
    });
  });

  await page.route("**/notifications/send", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, notification_id: 999 }),
    });
  });

  await page.route("**/notifications", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.continue();
      return;
    }

    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ notifications: data.notifications }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/admin/dashboard-stats**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        pending_verifications: 8,
        pending_fraud_reports: 3,
        claimed_count: 14,
        unclaimed_count: 11,
        to_review_count: 6,
        lost_count: 9,
        returned_count: 5,
        reported_count: 2,
      }),
    });
  });

  await page.route("**/admin/stats/weekly**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
        series: {
          missing: [3, 5, 2, 4],
          found: [4, 6, 3, 5],
          reports: [1, 2, 1, 3],
          pending: [4, 5, 3, 6],
        },
      }),
    });
  });

  await page.route("**/admin/stats/export**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        rows: [],
      }),
    });
  });

  await page.route("**/admin/users**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ users: data.adminUsers }),
    });
  });

  await page.route("**/announcements**", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.continue();
      return;
    }

    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ announcements: data.announcementItems, count: data.announcementItems.length }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/audit-logs**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/storage/**", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await page.route("**/users/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            out_user_id: "user-201",
            out_user_name: "Paula Ramos",
            out_email: "paula.ramos@umak.edu.ph",
            out_profile_picture_url: PLACEHOLDER_IMAGE,
          },
        ],
      }),
    });
  });

  await page.route("**/claims/process", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/claims/by-item/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/posts/public**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ posts: [data.missingDetail] }),
    });
  });

  await page.route("**/posts/by-item-details/MISS-900", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data.linkedMissingItem),
    });
  });

  await page.route("**/posts/*/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/posts/items/*/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/posts/101/full", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data.foundDetail),
    });
  });

  await page.route("**/posts/102/full", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data.missingDetail),
    });
  });

  await page.route("**/posts", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.continue();
      return;
    }

    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ posts: data.foundRecordList, count: data.foundRecordList.length }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/fraud-reports/FR-2001/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/fraud-reports/FR-2001/resolve", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  await page.route("**/fraud-reports/FR-2001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data.fraudDetail),
    });
  });

  await page.route("**/fraud-reports", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.continue();
      return;
    }

    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reports: data.fraudList, count: data.fraudList.length }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

async function authenticate(page, baseUrl, user) {
  const token = createMockJWT(user);

  await page.context().addCookies([
    {
      name: "umak_link_web_api_token",
      value: token,
      url: baseUrl,
      sameSite: "Lax",
    },
  ]);

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ tokenValue, roleValue }) => {
      localStorage.setItem("umak_link_web_api_token", tokenValue);
      localStorage.setItem("umak_link_web_role", roleValue);
    },
    {
      tokenValue: token,
      roleValue: user.user_type,
    }
  );
}

function getUserForRole(role) {
  return role === "admin" ? USERS.admin : USERS.staff;
}

function getStorageStatePath(args, role) {
  if (role === "admin") {
    return path.resolve(args["admin-state"] || DEFAULT_ADMIN_STATE);
  }

  return path.resolve(args["staff-state"] || DEFAULT_STAFF_STATE);
}

function resolveAuthMode(args) {
  return args["auth-mode"] || "mock";
}

function resolveDataMode(args) {
  return args["data-mode"] || "mock";
}

async function createCaptureContext(browser, args, role) {
  const authMode = resolveAuthMode(args);

  if (authMode === "state") {
    const storageStatePath = getStorageStatePath(args, role);
    if (!fileExists(storageStatePath)) {
      throw new Error(`Missing storage state for ${role}: ${storageStatePath}`);
    }

    return browser.newContext({
      viewport: { width: 1440, height: 1800 },
      deviceScaleFactor: 1,
      storageState: storageStatePath,
    });
  }

  return browser.newContext({
    viewport: { width: 1440, height: 1800 },
    deviceScaleFactor: 1,
  });
}

async function captureShot(browser, args, baseUrl, data, shot, screenshotDir) {
  const user = getUserForRole(shot.role);
  const context = await createCaptureContext(browser, args, shot.role);
  const page = await context.newPage();

  if (resolveDataMode(args) === "mock") {
    await setupMockRoutes(page, data, user);
  }

  if (resolveAuthMode(args) === "mock") {
    await authenticate(page, baseUrl, user);
  }

  await page.goto(`${baseUrl}${shot.route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  if (shot.beforeScreenshot) {
    await shot.beforeScreenshot(page);
  }

  const filename = `${shot.name}.png`;
  const outputPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: outputPath, fullPage: false });

  await context.close();
  return outputPath;
}

function buildManifest(args, sections, captured) {
  return {
    header: "Deliverable No. 3",
    university: "University of Makati - College of Computing and Information Sciences",
    course: "ELEC2",
    titleLabel: "Title",
    projectTitle: "WEB-BASED FACULTY PROFILING FOR THE COLLEGE OF COMPUTER SCIENCE",
    groupMembersLabel: args["group-members-label"] || "<Group Members Name>",
    transactionModuleTitle: "Transaction Module",
    sections: sections.map((section) => ({
      title: section.title,
      description: section.description,
      layout: section.layout,
      images: section.shots.map((shot) => ({
        path: captured[shot.name],
        caption: shot.name,
      })),
    })),
  };
}

function runCommand(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function ensureServerReady(startServer, baseUrl, port) {
  let devServer;

  if (startServer) {
    try {
      await waitForUrlReady(baseUrl, 1500);
    } catch {
      devServer = startDevServer(port);
      await waitForUrlReady(baseUrl, 120000);
    }
  }

  return devServer;
}

async function runLoginPhase(args, baseUrl) {
  const role = args.role;
  if (role !== "admin" && role !== "staff") {
    throw new Error(`--phase login requires --role admin|staff`);
  }

  const storageStatePath = getStorageStatePath(args, role);
  ensureDir(path.dirname(storageStatePath));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
  });
  const page = await context.newPage();

  process.stdout.write(
    `\nLogin phase for ${role}.\nOpen browser launched at ${baseUrl}.\nComplete login manually, then return here.\n`
  );

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await waitForEnter("Press Enter after login is complete and the app is ready...");
    await context.storageState({ path: storageStatePath });
    process.stdout.write(`Saved ${role} storage state to ${storageStatePath}\n`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runScreenshotsPhase(args, baseUrl, data, sections, screenshotDir, manifestPath) {
  const browser = await chromium.launch({ headless: true });

  try {
    const captured = {};

    for (const section of sections) {
      for (const shot of section.shots) {
        const imagePath = await captureShot(browser, args, baseUrl, data, shot, screenshotDir);
        captured[shot.name] = imagePath;
      }
    }

    const manifest = buildManifest(args, sections, captured);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    process.stdout.write(`\nScreenshots captured and manifest saved to ${manifestPath}\n`);
  } finally {
    await browser.close();
  }
}

async function runDocxPhase(args, manifestPath, docxPath) {
  if (!fileExists(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  await runCommand(PYTHON_BIN, [
    path.resolve(__dirname, "generate_transaction_docx.py"),
    "--manifest",
    manifestPath,
    "--output",
    docxPath,
    "--group-members",
    args["group-members"] || "",
  ]);

  process.stdout.write(`\nDOCX generated at ${docxPath}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(args["output-dir"] || DEFAULT_OUTPUT_DIR);
  const manifestPath = path.resolve(args.manifest || DEFAULT_MANIFEST);
  const screenshotDir = path.resolve(args["screenshot-dir"] || DEFAULT_SCREENSHOT_DIR);
  const docxPath = path.resolve(args["output-docx"] || DEFAULT_DOCX);
  const phase = args.phase || "all";
  const port = args.port || DEFAULT_PORT;
  const baseUrl = args["base-url"] || process.env.CAPTURE_BASE_URL || `http://localhost:${port}`;
  const startServer = args["start-server"] !== "false";
  const authMode = resolveAuthMode(args);
  const dataMode = resolveDataMode(args);
  const data = buildData();
  const sections = buildSections(args);

  ensureDir(outputDir);
  ensureDir(screenshotDir);
  ensureDir(DEFAULT_AUTH_DIR);

  const needsServer = phase === "all" || phase === "screenshots" || phase === "login";
  const devServer = await ensureServerReady(needsServer && startServer, baseUrl, port);

  try {
    if (phase === "login") {
      await runLoginPhase(args, baseUrl);
      return;
    }

    if ((phase === "screenshots" || phase === "all") && dataMode === "live" && authMode !== "state") {
      throw new Error(`Live data capture requires --auth-mode state so screenshots use a real logged-in browser session.`);
    }

    if (phase === "screenshots") {
      await runScreenshotsPhase(args, baseUrl, data, sections, screenshotDir, manifestPath);
      return;
    }

    if (phase === "docx") {
      await runDocxPhase(args, manifestPath, docxPath);
      return;
    }

    if (phase !== "all") {
      throw new Error(`Unsupported phase: ${phase}`);
    }

    await runScreenshotsPhase(args, baseUrl, data, sections, screenshotDir, manifestPath);
    await runDocxPhase(args, manifestPath, docxPath);
  } finally {
    if (devServer) {
      devServer.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
