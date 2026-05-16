import { test, expect } from "../../fixtures/index";
import { APP_ROUTES } from "../../config/routes";

test.describe("Staff Fraud Report Email Notifications", () => {
  test("opening a fraud report sends emails to the claimer, claim processor, and handover guard", async ({
    page,
    staffUser,
    setAuthToken,
  }) => {
    await setAuthToken(staffUser);

    const reportId = "report-email-101";
    const emailRequests: Array<{
      to: string;
      subject: string;
      senderUuid: string;
      html: string;
    }> = [];

    await page.route("**/fraud-reports", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reports: [
            {
              report_id: reportId,
              post_id: 101,
              report_status: "open",
              reason_for_reporting: "Claimed by another user",
              date_reported: "2026-05-16T06:00:00.000Z",
              item_name: "Black Wallet",
            },
          ],
          count: 1,
        }),
      });
    });

    await page.route(`**/fraud-reports/${reportId}/status`, async (route) => {
      if (route.request().method() !== "PUT") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route(`**/fraud-reports/${reportId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report_id: reportId,
          post_id: 101,
          report_status: "under_review",
          reason_for_reporting: "Claimed by another user",
          date_reported: "2026-05-16T06:00:00.000Z",
          created_at: "2026-05-16T06:00:00.000Z",
          proof_image_url: null,
          poster_id: "user-101",
          post_status: "accepted",
          item_id: "item-101",
          is_anonymous: false,
          last_seen_at: "2026-05-15T11:23:00.000Z",
          last_seen_location: "Main Gate",
          item_name: "Black Wallet",
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
          reporter_id: "staff-002",
          reporter_name: "Reporter Staff",
          reporter_profile_picture_url: null,
          poster_name: "Student Owner",
          poster_profile_picture_url: null,
          fraud_reviewer_id: staffUser.user_id,
          fraud_reviewer_name: staffUser.user_name,
          fraud_reviewer_email: staffUser.email,
          submitted_on_date_local: "2026-05-15T11:25:00.000Z",
          accepted_on_date_local: "2026-05-15T12:00:00.000Z",
          last_seen_date: "2026-05-15",
          last_seen_time: "11:23 AM",
          image_id: "image-101",
          claim_processed_by_name: "Staff Processor",
          claim_processed_by_email: "staff.processor@umak.edu.ph",
          claim_processed_by_profile_picture_url: null,
          reporter_email: "reporter.staff@umak.edu.ph",
          poster_email: "student.owner@umak.edu.ph",
          fraud_reviewer_profile_picture_url: null,
        }),
      });
    });

    await page.route("**/posts/101/full", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          post_id: 101,
          poster_id: "user-101",
          post_status: "accepted",
          item_id: "item-101",
          is_anonymous: false,
          submitted_on_date_local: "2026-05-15T11:25:00.000Z",
          rejection_reason: null,
          accepted_on_date_local: "2026-05-15T12:00:00.000Z",
          last_seen_date: "2026-05-15",
          last_seen_time: "11:23 AM",
          last_seen_at: "2026-05-15T11:23:00.000Z",
          last_seen_location: "Main Gate",
          item_name: "Black Wallet",
          item_description: "A black leather wallet with school ID and folded receipts.",
          image_id: "image-101",
          item_image_url: "https://example.com/item-101.jpg",
          item_status: "claimed",
          item_type: "found",
          category: "Accessories",
          custody_status: "with_guard",
          poster_name: "Student Owner",
          poster_email: "student.owner@umak.edu.ph",
          poster_profile_picture_url: null,
          claim_id: "claim-101",
          claimer_name: "Claimant Student",
          claimer_school_email: "claimant@umak.edu.ph",
          claimer_contact_num: "09123456789",
          claimed_at: "2026-05-16T07:00:00.000Z",
          claim_processed_by_name: "Staff Processor",
          claim_processed_by_email: "staff.processor@umak.edu.ph",
          claim_processed_by_profile_picture_url: null,
          claim_processed_by_user_type: "Staff",
          linked_lost_item_id: null,
          returned_at: null,
          accepted_by_guard_name: "Guard Greg",
          accepted_by_guard_email: "guard.greg@umak.edu.ph",
        }),
      });
    });

    await page.route("**/notifications/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, notification_id: 1 }),
      });
    });

    await page.route("**/email/send", async (route) => {
      emailRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto(APP_ROUTES.staff.fraudReportDetails(reportId));
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: "Open" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Open" }).first().click();
    await expect(
      page.getByText(
        "Once opened by you, other staff cannot open this report. Email notifications will also be sent to the claimer and any staff or guard involved in the original handover."
      )
    ).toBeVisible();
    await page.getByRole("button", { name: "Open" }).nth(1).click();

    await expect.poll(() => emailRequests.length).toBe(3);

    const recipients = emailRequests.map((request) => request.to).sort();
    expect(recipients).toEqual([
      "claimant@umak.edu.ph",
      "guard.greg@umak.edu.ph",
      "staff.processor@umak.edu.ph",
    ]);

    expect(
      emailRequests.some(
        (request) => request.subject === "URGENT: Claim Verification Required - Black Wallet"
      )
    ).toBeTruthy();
    expect(
      emailRequests.filter((request) => request.subject === "Fraud Report Opened - Black Wallet")
        .length
    ).toBe(2);

    await page.waitForURL(`**${APP_ROUTES.staff.fraudReports}`);
  });
});
