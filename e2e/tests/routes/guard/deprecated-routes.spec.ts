import { test, expect } from "../../../fixtures/index";
import { guardPortalRouteConfigs } from "../../../helpers/portal-route-configs";

const deprecatedGuardRoutes = Object.values(guardPortalRouteConfigs);
const notAllowedUrl = "http://localhost:3000/not-allowed";

test.describe("Deprecated guard routes", () => {
  for (const { route } of deprecatedGuardRoutes) {
    test(`${route} redirects to /not-allowed`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL(notAllowedUrl);
      await expect(page.getByText("Access Not Allowed")).toBeVisible();
    });
  }
});
