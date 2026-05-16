import { buildProtectedPortalRouteSuite } from "../../../helpers/portal-route-suite";
import { adminPortalRouteConfigs } from "../../../helpers/portal-route-configs";

buildProtectedPortalRouteSuite(adminPortalRouteConfigs.info);
