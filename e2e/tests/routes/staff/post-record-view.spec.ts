import { test, expect } from "../../../fixtures/index";
import {
  buildProtectedPortalRouteSuite,
  installPortalApiMocks,
  SAMPLE_POST_ID,
} from "../../../helpers/portal-route-suite";
import { staffPortalRouteConfigs } from "../../../helpers/portal-route-configs";

buildProtectedPortalRouteSuite(staffPortalRouteConfigs.postRecordView);

test.describe("Staff post record custody history", () => {
  test("renders custody events in chronological order when the API response is unsorted", async ({
    page,
    loginAsStaff,
  }) => {
    await installPortalApiMocks(page, [
      {
        method: "GET",
        path: `/custody/posts/${SAMPLE_POST_ID}/history`,
        statusCode: 200,
        body: {
          post_id: Number(SAMPLE_POST_ID),
          item_id: "item-101",
          post_status: "accepted",
          custody_status: "with_guard",
          history: [
            {
              history_id: "accepted-101",
              event_type: "guard_accepted",
              source_record_type: "guard_accepted",
              message: "Guard Stefanie Gabion has accepted handover",
              occurred_at: "2026-05-19T03:08:00.000Z",
              custody_attempt_id: "attempt-101",
              qr_code_session_id: "qr-session-101",
              attempt_number: 1,
              guard_post_id: "guard-post-101",
              guard_post_name: "Security Desk",
              full_location_name: "Admin Building > Lobby > Security Desk",
              handover_image_url: "https://example.com/custody-handover.webp",
              actor_user_id: "guard-001",
              actor_name: "Stefanie Gabion",
              decision_reason: null,
              discard_reason: null,
            },
            {
              history_id: "attempted-101",
              event_type: "handover_attempted",
              source_record_type: "attempt_started",
              message: "Guard handover attempted at Admin Building > Lobby > Security Desk",
              occurred_at: "2026-05-19T03:05:00.000Z",
              custody_attempt_id: "attempt-101",
              qr_code_session_id: "qr-session-101",
              attempt_number: 1,
              guard_post_id: "guard-post-101",
              guard_post_name: "Security Desk",
              full_location_name: "Admin Building > Lobby > Security Desk",
              handover_image_url: "https://example.com/custody-handover.webp",
              actor_user_id: "user-001",
              actor_name: "Student One",
              decision_reason: null,
              discard_reason: null,
            },
            {
              history_id: "reported-101",
              event_type: "item_reported",
              source_record_type: null,
              message: "Item reported in Umak Link",
              occurred_at: "2026-05-19T03:03:00.000Z",
              custody_attempt_id: null,
              qr_code_session_id: null,
              attempt_number: null,
              guard_post_id: null,
              guard_post_name: null,
              full_location_name: null,
              handover_image_url: null,
              actor_user_id: "user-001",
              actor_name: "Student One",
              decision_reason: null,
              discard_reason: null,
            },
          ],
        },
      },
    ]);

    await loginAsStaff();
    await page.goto(`/staff/post-record/view/${SAMPLE_POST_ID}`);

    const custodyPanel = page.locator("article").filter({ hasText: "Custody Record" }).first();
    await expect(custodyPanel).toContainText("Item reported in Umak Link");
    await expect(custodyPanel).toContainText(
      "Guard handover attempted at Admin Building > Lobby > Security Desk"
    );
    await expect(custodyPanel).toContainText("Guard Stefanie Gabion has accepted handover");

    const panelText = (await custodyPanel.textContent()) ?? "";
    expect(panelText.indexOf("Item reported in Umak Link")).toBeGreaterThanOrEqual(0);
    expect(
      panelText.indexOf("Item reported in Umak Link")
    ).toBeLessThan(panelText.indexOf("Guard handover attempted at Admin Building > Lobby > Security Desk"));
    expect(
      panelText.indexOf("Guard handover attempted at Admin Building > Lobby > Security Desk")
    ).toBeLessThan(panelText.indexOf("Guard Stefanie Gabion has accepted handover"));
  });
});
